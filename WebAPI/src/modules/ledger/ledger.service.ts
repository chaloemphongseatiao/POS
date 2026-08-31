import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { compareByName } from "../../lib/thaiSort";
import { round2 } from "../../lib/profit";
import { getVatConfig, splitVat } from "../../lib/vat";
import {
  addDayKey,
  addMonthKey,
  bangkokDateKey,
  bangkokDayStart,
  bangkokToday,
  dayKeyWeekday,
  daysInMonthKey,
} from "../../lib/datetime";
import type { LedgerCategoryInput, LedgerEntryInput, RecurringEntryInput } from "./ledger.schema";

/**
 * Bills that count towards sales, matching the reports module: a refunded bill
 * still happened, and its returned lines come back out through the refund
 * records. Only a voided bill never happened at all.
 */
const SOLD = { status: { not: "VOIDED" } };

// ─── Categories ───────────────────────────────────────────────────────────────

export async function listCategories(type?: "INCOME" | "EXPENSE") {
  const categories = await prisma.ledgerCategory.findMany({ where: type ? { type } : undefined });
  return categories.sort(compareByName);
}

export async function createCategory(data: LedgerCategoryInput) {
  const existing = await prisma.ledgerCategory.findUnique({
    where: { name_type: { name: data.name, type: data.type } },
  });
  if (existing) throw createError("หมวดหมู่นี้มีอยู่แล้ว", 409);
  return prisma.ledgerCategory.create({ data });
}

export async function updateCategory(id: number, data: LedgerCategoryInput) {
  return prisma.ledgerCategory.update({ where: { id }, data });
}

export async function deleteCategory(id: number) {
  const [entries, recurring] = await Promise.all([
    prisma.ledgerEntry.count({ where: { categoryId: id } }),
    prisma.recurringEntry.count({ where: { categoryId: id } }),
  ]);
  if (entries > 0) throw createError("ไม่สามารถลบหมวดหมู่ที่มีรายการอยู่ได้", 400);
  if (recurring > 0) throw createError("ไม่สามารถลบหมวดหมู่ที่มีรายการประจำอยู่ได้", 400);
  await prisma.ledgerCategory.delete({ where: { id } });
  return { id, deleted: true };
}

// ─── Entries ──────────────────────────────────────────────────────────────────

export async function listEntries(params: {
  from?: Date;
  to?: Date;
  type?: "INCOME" | "EXPENSE";
  categoryId?: number;
}) {
  return prisma.ledgerEntry.findMany({
    where: {
      type: params.type,
      categoryId: params.categoryId,
      entryDate: params.from || params.to ? { gte: params.from, lte: params.to } : undefined,
    },
    include: {
      category: { select: { id: true, name: true } },
      user: { select: { id: true, displayName: true } },
      recurring: { select: { id: true, name: true } },
    },
    orderBy: [{ entryDate: "desc" }, { id: "desc" }],
  });
}

/**
 * The rate is snapshotted onto the entry rather than read back from settings at
 * report time — otherwise changing the shop's rate would silently restate the
 * tax on every period already filed.
 */
async function vatRateFor(hasVat: boolean): Promise<number> {
  if (!hasVat) return 0;
  const vat = await getVatConfig();
  if (!vat.enabled) throw createError("ยังไม่ได้เปิดใช้งาน VAT ในการตั้งค่าร้าน", 400);
  return vat.rate;
}

export async function createEntry(userId: number, data: LedgerEntryInput) {
  const category = await prisma.ledgerCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw createError("ไม่พบหมวดหมู่", 404);
  if (!category.isActive) throw createError("หมวดหมู่นี้ถูกปิดใช้งานแล้ว", 400);

  return prisma.ledgerEntry.create({
    data: {
      categoryId: category.id,
      type: category.type,
      amount: data.amount,
      hasVat: data.hasVat,
      vatRate: await vatRateFor(data.hasVat),
      note: data.note,
      entryDate: data.entryDate,
      userId,
    },
  });
}

export async function updateEntry(id: number, data: LedgerEntryInput) {
  const category = await prisma.ledgerCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw createError("ไม่พบหมวดหมู่", 404);

  return prisma.ledgerEntry.update({
    where: { id },
    data: {
      categoryId: category.id,
      type: category.type,
      amount: data.amount,
      hasVat: data.hasVat,
      vatRate: await vatRateFor(data.hasVat),
      note: data.note,
      entryDate: data.entryDate,
    },
  });
}

export async function deleteEntry(id: number) {
  await prisma.ledgerEntry.delete({ where: { id } });
  return { id, deleted: true };
}

// ─── Shared aggregation ───────────────────────────────────────────────────────

/** The VAT embedded in one ledger amount, using the rate frozen on the entry. */
function entrySplit(entry: { amount: unknown; hasVat: boolean; vatRate: unknown }) {
  return splitVat(Number(entry.amount), entry.hasVat ? Number(entry.vatRate) : 0);
}

/**
 * Sales as the P&L counts them, in gross (VAT-inclusive) money: what the tills
 * took, less what was refunded, and the cost of the goods that stayed sold.
 * Deliberately the same arithmetic as `reports.getSummary`, so the accounting
 * screen and the sales reports can never quote different revenue for a range.
 */
async function grossSales(from: Date, to: Date) {
  const [orders, refunds] = await Promise.all([
    prisma.order.findMany({
      where: { ...SOLD, createdAt: { gte: from, lte: to } },
      select: { createdAt: true, totalAmt: true, items: { select: { quantity: true, costPrice: true } } },
    }),
    prisma.refund.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true, totalAmt: true, totalCost: true },
    }),
  ]);

  let revenue = 0;
  let cost = 0;
  let refundTotal = 0;
  const byMonth = new Map<string, { revenue: number; cost: number }>();

  const bucket = (date: Date) => {
    const key = bangkokDateKey(date).slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, { revenue: 0, cost: 0 });
    return byMonth.get(key)!;
  };

  for (const order of orders) {
    const month = bucket(order.createdAt);
    revenue += Number(order.totalAmt);
    month.revenue += Number(order.totalAmt);
    for (const item of order.items) {
      const itemCost = Number(item.costPrice ?? 0) * item.quantity;
      cost += itemCost;
      month.cost += itemCost;
    }
  }

  for (const refund of refunds) {
    const month = bucket(refund.createdAt);
    refundTotal += Number(refund.totalAmt);
    revenue -= Number(refund.totalAmt);
    month.revenue -= Number(refund.totalAmt);
    // Returned goods are back on the shelf, so they are no longer a cost of sale.
    cost -= Number(refund.totalCost);
    month.cost -= Number(refund.totalCost);
  }

  return {
    revenue: round2(revenue),
    cost: round2(cost),
    refundTotal: round2(refundTotal),
    orderCount: orders.length,
    refundCount: refunds.length,
    byMonth,
  };
}

// ─── Summary (ledger only) ────────────────────────────────────────────────────

export async function getSummary(from: Date, to: Date) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { entryDate: { gte: from, lte: to } },
    include: { category: { select: { id: true, name: true } } },
  });

  let income = 0;
  let expense = 0;
  const byCategory = new Map<number, { categoryId: number; category: string; type: string; total: number }>();

  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.type === "INCOME") income += amount;
    else expense += amount;

    const bucket = byCategory.get(entry.categoryId) ?? {
      categoryId: entry.categoryId,
      category: entry.category.name,
      type: entry.type,
      total: 0,
    };
    bucket.total += amount;
    byCategory.set(entry.categoryId, bucket);
  }

  return {
    income: round2(income),
    expense: round2(expense),
    net: round2(income - expense),
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.total - a.total),
    from,
    to,
  };
}

// ─── Profit & loss (sales + ledger) ───────────────────────────────────────────

export type ProfitLoss = Awaited<ReturnType<typeof getProfitLoss>>;

/**
 * The figure the owner actually wants: what the shop kept after the goods, the
 * rent and the tax. Sales come from the tills, everything else from the ledger,
 * and every line is stated *excluding* VAT — tax collected on a sale is the
 * revenue department's money passing through, not income, so counting it would
 * inflate the profit by the whole VAT amount.
 */
export async function getProfitLoss(from: Date, to: Date) {
  const vat = await getVatConfig();
  const [sales, entries] = await Promise.all([
    grossSales(from, to),
    prisma.ledgerEntry.findMany({
      where: { entryDate: { gte: from, lte: to } },
      include: { category: { select: { id: true, name: true } } },
    }),
  ]);

  const salesSplit = splitVat(sales.revenue, vat.rate);
  // Goods bought without a tax invoice carry no reclaimable tax, so their whole
  // price stays in the cost of sales.
  const cogsSplit = splitVat(sales.cost, vat.costInclusive ? vat.rate : 0);
  const grossProfit = round2(salesSplit.net - cogsSplit.net);

  let otherIncome = 0;
  let expense = 0;
  let outputVatOther = 0;
  let inputVatOther = 0;
  const byCategory = new Map<
    number,
    { categoryId: number; category: string; type: string; net: number; vat: number; gross: number }
  >();

  for (const entry of entries) {
    const split = entrySplit(entry);
    if (entry.type === "INCOME") {
      otherIncome += split.net;
      outputVatOther += split.vat;
    } else {
      expense += split.net;
      inputVatOther += split.vat;
    }

    const bucket = byCategory.get(entry.categoryId) ?? {
      categoryId: entry.categoryId,
      category: entry.category.name,
      type: entry.type,
      net: 0,
      vat: 0,
      gross: 0,
    };
    bucket.net = round2(bucket.net + split.net);
    bucket.vat = round2(bucket.vat + split.vat);
    bucket.gross = round2(bucket.gross + split.gross);
    byCategory.set(entry.categoryId, bucket);
  }

  otherIncome = round2(otherIncome);
  expense = round2(expense);
  const outputVat = round2(salesSplit.vat + outputVatOther);
  const inputVat = round2(cogsSplit.vat + inputVatOther);

  return {
    from,
    to,
    vat: {
      enabled: vat.enabled,
      rate: vat.rate,
      /** Tax charged to customers on the shop's sales and other income. */
      outputVat,
      /** Tax the shop already paid on goods and expenses, claimable back. */
      inputVat,
      /** Positive means the shop owes the revenue department this much. */
      payable: round2(outputVat - inputVat),
    },
    sales: {
      /** What the tills took, VAT included — matches the sales reports exactly. */
      gross: sales.revenue,
      net: salesSplit.net,
      vat: salesSplit.vat,
      refundTotal: sales.refundTotal,
      orderCount: sales.orderCount,
      refundCount: sales.refundCount,
    },
    cogs: { gross: sales.cost, net: cogsSplit.net, vat: cogsSplit.vat },
    grossProfit,
    /** Gross profit as a share of net sales — what is left after the goods. */
    grossMargin: salesSplit.net > 0 ? round2((grossProfit / salesSplit.net) * 100) : 0,
    otherIncome,
    expense,
    netProfit: round2(grossProfit + otherIncome - expense),
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.net - a.net),
  };
}

// ─── VAT report ───────────────────────────────────────────────────────────────

/**
 * Output and input tax per Bangkok month — the shape a Thai shop files monthly.
 * Months are enumerated across the whole range so a month with no activity
 * still shows as a zero row instead of silently vanishing from the filing.
 */
export async function getVatReport(from: Date, to: Date) {
  const vat = await getVatConfig();
  const [sales, entries] = await Promise.all([
    grossSales(from, to),
    prisma.ledgerEntry.findMany({
      where: { entryDate: { gte: from, lte: to }, hasVat: true },
      select: { type: true, amount: true, hasVat: true, vatRate: true, entryDate: true },
    }),
  ]);

  type MonthRow = {
    month: string;
    salesNet: number;
    outputVat: number;
    purchaseNet: number;
    inputVat: number;
  };
  const rows = new Map<string, MonthRow>();
  const bucket = (month: string) => {
    if (!rows.has(month)) {
      rows.set(month, { month, salesNet: 0, outputVat: 0, purchaseNet: 0, inputVat: 0 });
    }
    return rows.get(month)!;
  };

  const firstMonth = bangkokDateKey(from).slice(0, 7);
  const lastMonth = bangkokDateKey(to).slice(0, 7);
  for (let month = firstMonth; month <= lastMonth; month = addMonthKey(month, 1)) bucket(month);

  for (const [month, totals] of sales.byMonth) {
    const row = bucket(month);
    const split = splitVat(totals.revenue, vat.rate);
    const cost = splitVat(totals.cost, vat.costInclusive ? vat.rate : 0);
    row.salesNet += split.net;
    row.outputVat += split.vat;
    row.purchaseNet += cost.net;
    row.inputVat += cost.vat;
  }

  for (const entry of entries) {
    const row = bucket(bangkokDateKey(entry.entryDate).slice(0, 7));
    const split = entrySplit(entry);
    if (entry.type === "INCOME") {
      row.salesNet += split.net;
      row.outputVat += split.vat;
    } else {
      row.purchaseNet += split.net;
      row.inputVat += split.vat;
    }
  }

  const months = Array.from(rows.values())
    .map((row) => ({
      month: row.month,
      salesNet: round2(row.salesNet),
      outputVat: round2(row.outputVat),
      purchaseNet: round2(row.purchaseNet),
      inputVat: round2(row.inputVat),
      payable: round2(row.outputVat - row.inputVat),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const total = months.reduce(
    (sum, row) => ({
      salesNet: round2(sum.salesNet + row.salesNet),
      outputVat: round2(sum.outputVat + row.outputVat),
      purchaseNet: round2(sum.purchaseNet + row.purchaseNet),
      inputVat: round2(sum.inputVat + row.inputVat),
      payable: round2(sum.payable + row.payable),
    }),
    { salesNet: 0, outputVat: 0, purchaseNet: 0, inputVat: 0, payable: 0 },
  );

  return { from, to, enabled: vat.enabled, rate: vat.rate, taxId: vat.taxId, months, total };
}

// ─── Recurring entries ────────────────────────────────────────────────────────

export async function listRecurring() {
  return prisma.recurringEntry.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ isActive: "desc" }, { id: "desc" }],
  });
}

async function recurringData(data: RecurringEntryInput) {
  const category = await prisma.ledgerCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw createError("ไม่พบหมวดหมู่", 404);
  if (!category.isActive) throw createError("หมวดหมู่นี้ถูกปิดใช้งานแล้ว", 400);

  return {
    name: data.name,
    categoryId: category.id,
    type: category.type,
    amount: data.amount,
    hasVat: data.hasVat,
    note: data.note ?? null,
    frequency: data.frequency,
    dayOf: data.dayOf,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
    isActive: data.isActive,
  };
}

export async function createRecurring(data: RecurringEntryInput) {
  return prisma.recurringEntry.create({ data: await recurringData(data) });
}

export async function updateRecurring(id: number, data: RecurringEntryInput) {
  return prisma.recurringEntry.update({ where: { id }, data: await recurringData(data) });
}

/**
 * Deleting a template leaves the entries it already posted alone — they are
 * real money that was really spent. The schema's `SetNull` clears their
 * `recurringId`, so they simply become ordinary hand-entered rows.
 */
export async function deleteRecurring(id: number) {
  await prisma.recurringEntry.delete({ where: { id } });
  return { id, deleted: true };
}

type Schedule = { frequency: string; dayOf: number; startDate: Date; endDate: Date | null };

/**
 * Capped so a template with a start date years back cannot generate an
 * unbounded batch the first time the poster runs.
 */
const MAX_POSTINGS_PER_RUN = 400;

/**
 * Every Bangkok calendar day the schedule falls on, from its start up to today.
 * A monthly day past the end of a short month books on that month's last day,
 * so a "31st" template still charges once in February rather than skipping it.
 */
function dueDateKeys(schedule: Schedule, todayKey: string): string[] {
  const startKey = bangkokDateKey(schedule.startDate);
  const endKey = schedule.endDate ? bangkokDateKey(schedule.endDate) : todayKey;
  const lastKey = endKey < todayKey ? endKey : todayKey;
  if (startKey > lastKey) return [];

  const keys: string[] = [];
  if (schedule.frequency === "WEEKLY") {
    const offset = (schedule.dayOf - dayKeyWeekday(startKey) + 7) % 7;
    for (let key = addDayKey(startKey, offset); key <= lastKey; key = addDayKey(key, 7)) {
      keys.push(key);
      if (keys.length >= MAX_POSTINGS_PER_RUN) break;
    }
    return keys;
  }

  for (let month = startKey.slice(0, 7); month <= lastKey.slice(0, 7); month = addMonthKey(month, 1)) {
    const day = Math.min(schedule.dayOf, daysInMonthKey(month));
    const key = `${month}-${String(day).padStart(2, "0")}`;
    if (key >= startKey && key <= lastKey) keys.push(key);
    if (keys.length >= MAX_POSTINGS_PER_RUN) break;
  }
  return keys;
}

/** Templates with at least one unposted due date, and what each one owes. */
export async function getRecurringDue() {
  const todayKey = bangkokToday();
  const templates = await prisma.recurringEntry.findMany({
    where: { isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      entries: { select: { entryDate: true } },
    },
  });

  const due = templates
    .map((template) => {
      const posted = new Set(template.entries.map((entry) => bangkokDateKey(entry.entryDate)));
      const dates = dueDateKeys(template, todayKey).filter((key) => !posted.has(key));
      return {
        id: template.id,
        name: template.name,
        type: template.type,
        category: template.category.name,
        amount: Number(template.amount),
        dates,
        total: round2(Number(template.amount) * dates.length),
      };
    })
    .filter((item) => item.dates.length > 0);

  return { count: due.reduce((sum, item) => sum + item.dates.length, 0), templates: due };
}

/**
 * Books every due posting that is not already in the ledger. `skipDuplicates`
 * plus the (recurringId, entryDate) unique index make this idempotent, so two
 * owners pressing the button at once still get one charge per period.
 */
export async function runRecurring(userId: number) {
  const vat = await getVatConfig();
  const todayKey = bangkokToday();
  const templates = await prisma.recurringEntry.findMany({
    where: { isActive: true },
    include: { entries: { select: { entryDate: true } } },
  });

  const rows = templates.flatMap((template) => {
    const posted = new Set(template.entries.map((entry) => bangkokDateKey(entry.entryDate)));
    const taxed = template.hasVat && vat.enabled;
    return dueDateKeys(template, todayKey)
      .filter((key) => !posted.has(key))
      .map((key) => ({
        categoryId: template.categoryId,
        type: template.type,
        amount: template.amount,
        hasVat: taxed,
        vatRate: taxed ? vat.rate : 0,
        note: template.note ?? template.name,
        entryDate: bangkokDayStart(key),
        userId,
        recurringId: template.id,
      }));
  });

  if (rows.length === 0) return { posted: 0 };
  const result = await prisma.ledgerEntry.createMany({ data: rows, skipDuplicates: true });
  return { posted: result.count };
}

// ─── CSV exports ──────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = { INCOME: "รายรับ", EXPENSE: "รายจ่าย" };

export const ENTRY_CSV_HEADERS = [
  "วันที่",
  "ประเภท",
  "หมวดหมู่",
  "หมายเหตุ",
  "ก่อน VAT",
  "VAT",
  "รวม",
  "รายการประจำ",
  "ผู้บันทึก",
];

export async function entriesCsvRows(params: { from: Date; to: Date }) {
  const entries = await listEntries(params);
  return entries.map((entry) => {
    const split = entrySplit(entry);
    return [
      bangkokDateKey(entry.entryDate),
      TYPE_LABEL[entry.type] ?? entry.type,
      entry.category.name,
      entry.note ?? "",
      split.net.toFixed(2),
      split.vat.toFixed(2),
      split.gross.toFixed(2),
      entry.recurring?.name ?? "",
      entry.user.displayName,
    ];
  });
}

export const PROFIT_LOSS_CSV_HEADERS = ["รายการ", "จำนวนเงิน"];

export function profitLossCsvRows(pl: ProfitLoss): unknown[][] {
  const rows: unknown[][] = [
    ["ยอดขาย (รวม VAT)", pl.sales.gross.toFixed(2)],
    ["ยอดขายก่อน VAT", pl.sales.net.toFixed(2)],
    ["ต้นทุนสินค้าที่ขาย", pl.cogs.net.toFixed(2)],
    ["กำไรขั้นต้น", pl.grossProfit.toFixed(2)],
    ["รายรับอื่น", pl.otherIncome.toFixed(2)],
    ["รายจ่าย", pl.expense.toFixed(2)],
    ["กำไรสุทธิ", pl.netProfit.toFixed(2)],
    [],
    ["หมวดหมู่", "ประเภท", "ก่อน VAT", "VAT", "รวม"],
  ];
  for (const row of pl.byCategory) {
    rows.push([
      row.category,
      TYPE_LABEL[row.type] ?? row.type,
      row.net.toFixed(2),
      row.vat.toFixed(2),
      row.gross.toFixed(2),
    ]);
  }
  if (pl.vat.enabled) {
    rows.push(
      [],
      ["ภาษีขาย", pl.vat.outputVat.toFixed(2)],
      ["ภาษีซื้อ", pl.vat.inputVat.toFixed(2)],
      ["ภาษีที่ต้องชำระ", pl.vat.payable.toFixed(2)],
    );
  }
  return rows;
}
