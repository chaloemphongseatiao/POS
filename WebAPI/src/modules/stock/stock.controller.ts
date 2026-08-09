import { Request, Response, NextFunction } from "express";
import { MovementType } from "../../types/enums";
import * as svc from "./stock.service";
import { numericParam } from "../../middleware/validate";
import { parseBangkok } from "../../lib/datetime";

const STOCK_STATUSES = ["normal", "low", "out", "low_out"] as const;
type StockStatus = (typeof STOCK_STATUSES)[number];

function parseStatus(value: unknown): StockStatus | undefined {
  return STOCK_STATUSES.includes(value as StockStatus) ? (value as StockStatus) : undefined;
}

const MOVEMENT_TYPES: MovementType[] = ["STOCK_IN", "STOCK_OUT", "SALE", "ADJUST", "RETURN"];

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, categoryId, lowOnly, status, page, limit } = req.query;
    res.json(await svc.listStock({
      search: typeof search === "string" && search.trim() ? search.trim() : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      lowOnly: lowOnly === "true",
      status: parseStatus(status),
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }));
  } catch (err) { next(err); }
}

export async function lowStock(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getLowStock()); } catch (err) { next(err); }
}

export async function movements(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getMovements(numericParam(req, "productId"))); } catch (err) { next(err); }
}

export async function allMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId, type, from, to, limit } = req.query;
    res.json(
      await svc.getAllMovements({
        productId: productId ? Number(productId) : undefined,
        type: MOVEMENT_TYPES.includes(type as MovementType) ? (type as MovementType) : undefined,
        from: parseBangkok(from as string | undefined),
        to: parseBangkok(to as string | undefined),
        limit: limit ? Number(limit) : undefined,
      })
    );
  } catch (err) { next(err); }
}

export async function stockIn(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity, note } = req.body;
    res.status(201).json(
      await svc.stockIn(numericParam(req, "productId"), quantity, note, req.user!.id)
    );
  } catch (err) { next(err); }
}

export async function importMany(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.importStock(req.body?.rows, req.user!.id)); } catch (err) { next(err); }
}

export async function receive(req: Request, res: Response, next: NextFunction) {
  try {
    const { items, note, reference } = req.body;
    res.status(201).json(await svc.receiveStock(items, note, reference, req.user!.id));
  } catch (err) { next(err); }
}

export async function adjust(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity, note } = req.body;
    res.json(
      await svc.adjustStock(numericParam(req, "productId"), quantity, note, req.user!.id)
    );
  } catch (err) { next(err); }
}
