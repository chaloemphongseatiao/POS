import { Prisma } from "@prisma/client";
import type { MovementType } from "../../types/enums";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { publicProductImageUrl } from "../products/productImage";
import { marginPct, markupPct, round2 } from "../../lib/profit";

type StockStatus = "normal" | "low" | "out" | "low_out";

/**
 * "low" and "normal" compare `Stock.quantity` against `Product.lowStockAt` —
 * two different columns, which the Prisma query API can't express. Filtering
 * and paging in SQL keeps this from loading the whole catalogue into memory
 * on every request.
 */
function stockFilterSql(params: { search?: string; categoryId?: number; status?: StockStatus }): Prisma.Sql {
  const conditions: Prisma.Sql[] = [Prisma.sql`p."isActive" = true`];

  if (params.categoryId) conditions.push(Prisma.sql`p."categoryId" = ${params.categoryId}`);

  if (params.search) {
    const like = `%${params.search}%`;
    conditions.push(Prisma.sql`(p."name" ILIKE ${like} OR p."barcode" ILIKE ${like})`);
  }

  switch (params.status) {
    case "out":
      conditions.push(Prisma.sql`s."quantity" <= 0`);
      break;
    case "low":
      conditions.push(Prisma.sql`s."quantity" > 0 AND s."quantity" <= p."lowStockAt"`);
      break;
    case "low_out":
      conditions.push(Prisma.sql`s."quantity" <= p."lowStockAt"`);
      break;
    case "normal":
      conditions.push(Prisma.sql`s."quantity" > p."lowStockAt"`);
      break;
  }

  return Prisma.sql`FROM "Stock" s JOIN "Product" p ON p."id" = s."productId" WHERE ${Prisma.join(
    conditions,
    " AND "
  )}`;
}

export async function listStock(params: {
  search?: string;
  categoryId?: number;
  lowOnly?: boolean;
  status?: StockStatus;
  page?: number;
  limit?: number;
} = {}) {
  const { search, categoryId, lowOnly, status } = params;
  const resolvedStatus = status ?? (lowOnly ? "low_out" : undefined);
  const safePage = Math.max(1, params.page ?? 1);
  // The ceiling is generous enough for the Excel export to page through a
  // whole catalogue in a few requests.
  const safeLimit = Math.min(200, Math.max(1, params.limit ?? 20));

  const filter = stockFilterSql({ search, categoryId, status: resolvedStatus });

  const [countRows, idRows, valuation] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`SELECT COUNT(*)::bigint AS count ${filter}`),
    prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT s."id" ${filter} ORDER BY p."name" ASC, s."id" ASC LIMIT ${safeLimit} OFFSET ${
        (safePage - 1) * safeLimit
      }`
    ),
    stockValuation(filter),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const stocks = await findStocksByIds(idRows.map((row) => row.id));

  return { stocks, total, page: safePage, limit: safeLimit, valuation };
}

/**
 * What the shelves are worth right now, over the whole filtered set rather
 * than the current page — a page-sized total would change every time the user
 * clicks "next". Empty shelves are skipped instead of clamped: a negative
 * quantity is a data fault, and silently valuing it at zero would hide it.
 */
async function stockValuation(filter: Prisma.Sql) {
  const [row] = await prisma.$queryRaw<
    { cost: string | null; retail: string | null; quantity: bigint | null }[]
  >(Prisma.sql`
    SELECT
      SUM(s."quantity" * p."costPrice") AS cost,
      SUM(s."quantity" * p."sellPrice") AS retail,
      SUM(s."quantity")::bigint AS quantity
    ${filter}
  `);

  const cost = round2(Number(row?.cost ?? 0));
  const retail = round2(Number(row?.retail ?? 0));
  const profit = round2(retail - cost);

  return {
    quantity: Number(row?.quantity ?? 0),
    cost,
    retail,
    /** Profit the shelves would make if every unit sold at today's price. */
    profit,
    margin: marginPct(retail, profit),
    markup: markupPct(cost, profit),
  };
}

async function findStocksByIds(ids: number[]) {
  if (ids.length === 0) return [];

  const stocks = await prisma.stock.findMany({
    where: { id: { in: ids } },
    include: {
      product: {
        select: {
          id: true,
          barcode: true,
          name: true,
          unit: true,
          costPrice: true,
          sellPrice: true,
          lowStockAt: true,
          isActive: true,
          imageUrl: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  const totals = await movementTotals(stocks.map((stock) => stock.productId));

  return stocks.map((stock) => {
    const { updatedAt, ...product } = stock.product;
    const total = totals.get(stock.productId);
    return {
      ...stock,
      totalIn: total?.in ?? 0,
      totalOut: total?.out ?? 0,
      product: {
        ...product,
        costPrice: product.costPrice.toFixed(2),
        sellPrice: product.sellPrice.toFixed(2),
        imageUrl: publicProductImageUrl(product.id, product.imageUrl, updatedAt),
      },
    };
  });
}

/**
 * Lifetime received / issued per product, split by the sign of the movement
 * rather than by its type: `ADJUST` counts on both sides depending on which
 * way the stocktake went, and summing it as one group would let a +5 and a
 * -5 cancel out. Outgoing quantities are stored negative, hence the flip.
 */
async function movementTotals(productIds: number[]) {
  const where = { productId: { in: productIds } };
  const [incoming, outgoing] = await Promise.all([
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: { ...where, quantity: { gt: 0 } },
      _sum: { quantity: true },
    }),
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: { ...where, quantity: { lt: 0 } },
      _sum: { quantity: true },
    }),
  ]);

  const totals = new Map<number, { in: number; out: number }>();
  const entryFor = (productId: number) => {
    const entry = totals.get(productId) ?? { in: 0, out: 0 };
    totals.set(productId, entry);
    return entry;
  };

  for (const row of incoming) entryFor(row.productId).in += row._sum.quantity ?? 0;
  for (const row of outgoing) entryFor(row.productId).out += -(row._sum.quantity ?? 0);

  return totals;
}

export async function getLowStock() {
  const filter = stockFilterSql({ status: "low_out" });
  const idRows = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT s."id" ${filter} ORDER BY p."name" ASC LIMIT 500`
  );
  return findStocksByIds(idRows.map((row) => row.id));
}

export async function getMovements(productId: number) {
  return prisma.stockMovement.findMany({
    where: { productId },
    include: {
      user: { select: { displayName: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getAllMovements(params: {
  productId?: number;
  type?: MovementType;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  // The reports screen pulls a whole period at once, so the ceiling is higher
  // than a screenful — but still bounded, since this is an unpaged read.
  const take = Math.min(2000, Math.max(1, params.limit ?? 200));

  return prisma.stockMovement.findMany({
    where: {
      ...(params.productId && { productId: params.productId }),
      ...(params.type && { type: params.type }),
      ...(params.from || params.to
        ? { createdAt: { gte: params.from, lte: params.to } }
        : {}),
    },
    include: {
      product: { select: { id: true, name: true, barcode: true, unit: true } },
      user: { select: { displayName: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function stockIn(productId: number, quantity: number, note: string, userId: number) {
  return prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({ where: { productId } });
    if (!stock) throw createError("ไม่พบ stock ของสินค้านี้", 404);

    await tx.stock.update({
      where: { productId },
      data: { quantity: { increment: quantity } },
    });

    return tx.stockMovement.create({
      data: { type: "STOCK_IN", quantity, note, productId, userId },
    });
  });
}

export interface ReceiveItem {
  productId: number;
  quantity: number;
  costPrice?: number;
}

/** One product's share of a receipt, after merging repeated lines. */
interface ReceiptLine {
  productId: number;
  quantity: number;
  /** Quantity received with a stated cost — the only part that moves the average. */
  pricedQuantity: number;
  /** Money paid for `pricedQuantity` (quantity × unit cost, summed). */
  pricedCost: Prisma.Decimal;
}

/**
 * Weighted average costing: the product's cost price becomes the average of
 * what is already on the shelf and what just arrived. Quantity received
 * without a stated cost is carried in at the current cost, so it dilutes
 * nothing.
 */
export function averageCost(
  currentQuantity: number,
  currentCost: Prisma.Decimal,
  line: ReceiptLine
): Prisma.Decimal {
  // Negative stock (oversold) would otherwise credit the average with units
  // that aren't there.
  const onHand = Math.max(currentQuantity, 0);
  const atCurrentCost = onHand + (line.quantity - line.pricedQuantity);
  const totalQuantity = onHand + line.quantity;

  const totalValue = currentCost.times(atCurrentCost).plus(line.pricedCost);
  return totalValue.dividedBy(totalQuantity).toDecimalPlaces(4);
}

/**
 * Goods receipt: one delivery, many products, one transaction. Repeated
 * products in the same receipt are merged so a product can't get two
 * competing `Stock` writes inside the transaction.
 */
export async function receiveStock(
  items: ReceiveItem[],
  note: string,
  reference: string,
  userId: number
) {
  const merged = new Map<number, ReceiptLine>();
  for (const item of items) {
    const line = merged.get(item.productId) ?? {
      productId: item.productId,
      quantity: 0,
      pricedQuantity: 0,
      pricedCost: new Prisma.Decimal(0),
    };
    line.quantity += item.quantity;
    if (item.costPrice !== undefined) {
      line.pricedQuantity += item.quantity;
      line.pricedCost = line.pricedCost.plus(new Prisma.Decimal(item.costPrice).times(item.quantity));
    }
    merged.set(item.productId, line);
  }
  const lines = [...merged.values()];

  const movementNote = [reference && `อ้างอิง ${reference}`, note].filter(Boolean).join(" · ");

  return prisma.$transaction(async (tx) => {
    const productIds = lines.map((line) => line.productId);

    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, isActive: true, costPrice: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    for (const line of lines) {
      const product = byId.get(line.productId);
      if (!product) throw createError(`ไม่พบสินค้า (id ${line.productId})`, 404);
      if (!product.isActive) throw createError(`สินค้า "${product.name}" ถูกปิดการขายอยู่`, 400);
    }

    // Read before writing: the average is weighted by the quantity that was
    // on hand *before* this receipt.
    const stocksBefore = await tx.stock.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, quantity: true },
    });
    const quantityBefore = new Map(stocksBefore.map((stock) => [stock.productId, stock.quantity]));

    const newCosts = new Map<number, Prisma.Decimal>();

    for (const line of lines) {
      // Products created before their Stock row exists still receive fine.
      await tx.stock.upsert({
        where: { productId: line.productId },
        create: { productId: line.productId, quantity: line.quantity },
        update: { quantity: { increment: line.quantity } },
      });

      if (line.pricedQuantity > 0) {
        const cost = averageCost(
          quantityBefore.get(line.productId) ?? 0,
          byId.get(line.productId)!.costPrice,
          line
        );
        newCosts.set(line.productId, cost);
        await tx.product.update({
          where: { id: line.productId },
          data: { costPrice: cost },
        });
      }
    }

    await tx.stockMovement.createMany({
      data: lines.map((line) => ({
        type: "STOCK_IN",
        quantity: line.quantity,
        note: movementNote,
        productId: line.productId,
        userId,
      })),
    });

    return {
      itemCount: lines.length,
      totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
      items: lines.map((line) => ({
        productId: line.productId,
        name: byId.get(line.productId)!.name,
        quantity: line.quantity,
        stockAfter: (quantityBefore.get(line.productId) ?? 0) + line.quantity,
        costBefore: byId.get(line.productId)!.costPrice.toFixed(2),
        costAfter: (newCosts.get(line.productId) ?? byId.get(line.productId)!.costPrice).toFixed(2),
      })),
    };
    // A 200-line receipt still writes one `Stock` row at a time, which can
    // outrun Prisma's 5s default transaction budget on a remote database.
  }, { timeout: 30_000 });
}

export interface StockImportRow {
  row: number;
  barcode?: string;
  name?: string;
  quantity: number;
}

/**
 * Stocktake import: each row states what is actually on the shelf, so the
 * quantity is set rather than added, and the difference is written as an
 * `ADJUST` movement. Receiving a delivery goes through `receiveStock`.
 */
export async function importStock(rows: StockImportRow[], userId: number) {
  if (!Array.isArray(rows) || rows.length === 0)
    throw createError("ไม่พบข้อมูลสต็อกสำหรับ import", 400);
  if (rows.length > 5000) throw createError("Import ได้สูงสุด 5,000 รายการต่อครั้ง", 400);

  const errors: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const key = row.barcode?.trim() || row.name?.trim().toLocaleLowerCase();
    if (!key) {
      errors.push(`แถว ${row.row}: ต้องระบุ Barcode หรือชื่อสินค้า`);
      continue;
    }
    if (seen.has(key)) errors.push(`แถว ${row.row}: สินค้าซ้ำในไฟล์`);
    seen.add(key);

    if (!Number.isInteger(row.quantity) || row.quantity < 0)
      errors.push(`แถว ${row.row}: จำนวนคงเหลือต้องเป็นจำนวนเต็มตั้งแต่ 0`);
  }

  if (errors.length > 0) throw createError(errors.slice(0, 20).join("\n"), 400);

  const barcodes = rows.map((row) => row.barcode?.trim()).filter((v): v is string => !!v);
  const names = rows.map((row) => row.name?.trim()).filter((v): v is string => !!v);

  const products = await prisma.product.findMany({
    where: { OR: [{ barcode: { in: barcodes } }, { name: { in: names } }] },
    select: { id: true, name: true, barcode: true, stock: { select: { quantity: true } } },
  });

  const byBarcode = new Map(products.filter((p) => p.barcode).map((p) => [p.barcode!, p]));
  // A name can repeat across products, so an ambiguous name has to be rejected
  // instead of silently adjusting whichever row came back first.
  const byName = new Map<string, typeof products>();
  for (const product of products) {
    const key = product.name.trim().toLocaleLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), product]);
  }

  const targets: { productId: number; quantity: number; diff: number }[] = [];
  const seenProducts = new Set<number>();

  for (const row of rows) {
    const barcode = row.barcode?.trim();
    const name = row.name?.trim();
    let product = barcode ? byBarcode.get(barcode) : undefined;

    // A stated barcode that matches nothing is a typo, not an invitation to
    // fall back to the name and adjust some other product.
    if (barcode && !product) {
      errors.push(`แถว ${row.row}: ไม่พบสินค้า Barcode "${barcode}"`);
      continue;
    }

    if (!product && name) {
      const matches = byName.get(name.toLocaleLowerCase()) ?? [];
      if (matches.length > 1) {
        errors.push(`แถว ${row.row}: ชื่อ "${name}" ตรงกับสินค้าหลายรายการ ให้ระบุ Barcode`);
        continue;
      }
      product = matches[0];
    }

    if (!product) {
      errors.push(`แถว ${row.row}: ไม่พบสินค้า "${name}"`);
      continue;
    }

    // Two rows resolving to the same product would write contradicting
    // stocktake numbers, and only the last one would survive.
    if (seenProducts.has(product.id)) {
      errors.push(`แถว ${row.row}: สินค้า "${product.name}" ซ้ำกับแถวก่อนหน้า`);
      continue;
    }
    seenProducts.add(product.id);

    const diff = row.quantity - (product.stock?.quantity ?? 0);
    if (diff !== 0) targets.push({ productId: product.id, quantity: row.quantity, diff });
  }

  if (errors.length > 0) throw createError(errors.slice(0, 20).join("\n"), 400);

  await prisma.$transaction(async (tx) => {
    for (const target of targets) {
      await tx.stock.upsert({
        where: { productId: target.productId },
        create: { productId: target.productId, quantity: target.quantity },
        update: { quantity: target.quantity },
      });
    }

    await tx.stockMovement.createMany({
      data: targets.map((target) => ({
        type: "ADJUST",
        quantity: target.diff,
        note: "นำเข้าจาก Excel",
        productId: target.productId,
        userId,
      })),
    });
  }, { timeout: 30_000 });

  return { total: rows.length, updated: targets.length, unchanged: rows.length - targets.length };
}

export async function adjustStock(
  productId: number,
  newQuantity: number,
  note: string,
  userId: number
) {
  return prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({ where: { productId } });
    if (!stock) throw createError("ไม่พบ stock ของสินค้านี้", 404);

    const diff = newQuantity - stock.quantity;
    await tx.stock.update({ where: { productId }, data: { quantity: newQuantity } });

    return tx.stockMovement.create({
      data: { type: "ADJUST", quantity: diff, note, productId, userId },
    });
  });
}
