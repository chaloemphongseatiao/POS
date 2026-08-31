import { Request, Response, NextFunction } from "express";
import * as svc from "./ledger.service";
import { numericParam } from "../../middleware/validate";
import { sendCsv, toCsv } from "../../lib/csv";
import {
  parseBangkok,
  bangkokCurrentMonth,
  bangkokMonthRange,
  bangkokDateKey,
  bangkokDayEnd,
} from "../../lib/datetime";

function ledgerType(value: unknown): "INCOME" | "EXPENSE" | undefined {
  return value === "INCOME" || value === "EXPENSE" ? value : undefined;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A bare "to=YYYY-MM-DD" means "through the end of that day". Taken literally it
 * parses to midnight, which would silently drop every sale made on the last day
 * of the range — ledger entries book at midnight and would survive, so the
 * mistake shows up only once sales are mixed in.
 */
function parseTo(raw: string | undefined): Date | undefined {
  const trimmed = raw?.trim();
  if (trimmed && DATE_ONLY.test(trimmed)) return new Date(bangkokDayEnd(trimmed).getTime() - 1);
  return parseBangkok(trimmed);
}

function parseRange(req: Request) {
  const monthRange = bangkokMonthRange(bangkokCurrentMonth());
  return {
    from: parseBangkok(req.query.from as string | undefined) ?? monthRange.from,
    to: parseTo(req.query.to as string | undefined) ?? new Date(),
  };
}

/** ASCII-only so browsers and old spreadsheet apps do not mangle the download. */
function csvName(prefix: string, range: { from: Date; to: Date }): string {
  return `${prefix}-${bangkokDateKey(range.from)}-to-${bangkokDateKey(range.to)}.csv`;
}

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.listCategories(ledgerType(req.query.type))); } catch (err) { next(err); }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await svc.createCategory(req.body)); } catch (err) { next(err); }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.updateCategory(numericParam(req, "id"), req.body)); } catch (err) { next(err); }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.deleteCategory(numericParam(req, "id"))); } catch (err) { next(err); }
}

export async function listEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = parseRange(req);
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    res.json(await svc.listEntries({ from, to, type: ledgerType(req.query.type), categoryId }));
  } catch (err) { next(err); }
}

export async function createEntry(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await svc.createEntry(req.user!.id, req.body)); } catch (err) { next(err); }
}

export async function updateEntry(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.updateEntry(numericParam(req, "id"), req.body)); } catch (err) { next(err); }
}

export async function deleteEntry(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.deleteEntry(numericParam(req, "id"))); } catch (err) { next(err); }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = parseRange(req);
    res.json(await svc.getSummary(from, to));
  } catch (err) { next(err); }
}

export async function profitLoss(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = parseRange(req);
    res.json(await svc.getProfitLoss(from, to));
  } catch (err) { next(err); }
}

export async function vatReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = parseRange(req);
    res.json(await svc.getVatReport(from, to));
  } catch (err) { next(err); }
}

export async function listRecurring(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.listRecurring()); } catch (err) { next(err); }
}

export async function createRecurring(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await svc.createRecurring(req.body)); } catch (err) { next(err); }
}

export async function updateRecurring(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.updateRecurring(numericParam(req, "id"), req.body)); } catch (err) { next(err); }
}

export async function deleteRecurring(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.deleteRecurring(numericParam(req, "id"))); } catch (err) { next(err); }
}

export async function recurringDue(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getRecurringDue()); } catch (err) { next(err); }
}

export async function runRecurring(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.runRecurring(req.user!.id)); } catch (err) { next(err); }
}

export async function exportEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const range = parseRange(req);
    const rows = await svc.entriesCsvRows(range);
    sendCsv(res, csvName("ledger", range), toCsv(svc.ENTRY_CSV_HEADERS, rows));
  } catch (err) { next(err); }
}

export async function exportProfitLoss(req: Request, res: Response, next: NextFunction) {
  try {
    const range = parseRange(req);
    const pl = await svc.getProfitLoss(range.from, range.to);
    sendCsv(res, csvName("profit-loss", range), toCsv(svc.PROFIT_LOSS_CSV_HEADERS, svc.profitLossCsvRows(pl)));
  } catch (err) { next(err); }
}

export async function exportVat(req: Request, res: Response, next: NextFunction) {
  try {
    const range = parseRange(req);
    const report = await svc.getVatReport(range.from, range.to);
    const rows = report.months.map((month) => [
      month.month,
      month.salesNet.toFixed(2),
      month.outputVat.toFixed(2),
      month.purchaseNet.toFixed(2),
      month.inputVat.toFixed(2),
      month.payable.toFixed(2),
    ]);
    rows.push([
      "รวม",
      report.total.salesNet.toFixed(2),
      report.total.outputVat.toFixed(2),
      report.total.purchaseNet.toFixed(2),
      report.total.inputVat.toFixed(2),
      report.total.payable.toFixed(2),
    ]);
    const headers = ["เดือน", "ยอดขายก่อน VAT", "ภาษีขาย", "ยอดซื้อก่อน VAT", "ภาษีซื้อ", "ภาษีที่ต้องชำระ"];
    sendCsv(res, csvName("vat", range), toCsv(headers, rows));
  } catch (err) { next(err); }
}
