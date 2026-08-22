import { Request, Response, NextFunction } from "express";
import * as svc from "./ledger.service";
import { numericParam } from "../../middleware/validate";
import { parseBangkok, bangkokCurrentMonth, bangkokMonthRange } from "../../lib/datetime";

function ledgerType(value: unknown): "INCOME" | "EXPENSE" | undefined {
  return value === "INCOME" || value === "EXPENSE" ? value : undefined;
}

function parseRange(req: Request) {
  const monthRange = bangkokMonthRange(bangkokCurrentMonth());
  return {
    from: parseBangkok(req.query.from as string | undefined) ?? monthRange.from,
    to: parseBangkok(req.query.to as string | undefined) ?? new Date(),
  };
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
