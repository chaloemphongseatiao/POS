import { Request, Response, NextFunction } from "express";
import { MovementType } from "../../types/enums";
import * as svc from "./stock.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, categoryId, lowOnly, status, page, limit } = req.query;
    res.json(await svc.listStock({
      search: search as string,
      categoryId: categoryId ? Number(categoryId) : undefined,
      lowOnly: lowOnly === "true",
      status: status as "normal" | "low" | "out" | "low_out" | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }));
  } catch (err) { next(err); }
}

export async function lowStock(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getLowStock()); } catch (err) { next(err); }
}

export async function movements(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getMovements(Number(req.params.productId))); } catch (err) { next(err); }
}

export async function allMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId, type, from, to } = req.query;
    res.json(
      await svc.getAllMovements({
        productId: productId ? Number(productId) : undefined,
        type: type as MovementType | undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      })
    );
  } catch (err) { next(err); }
}

export async function stockIn(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity, note } = req.body;
    res.status(201).json(
      await svc.stockIn(Number(req.params.productId), Number(quantity), note || "", req.user!.id)
    );
  } catch (err) { next(err); }
}

export async function adjust(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity, note } = req.body;
    res.json(
      await svc.adjustStock(Number(req.params.productId), Number(quantity), note || "", req.user!.id)
    );
  } catch (err) { next(err); }
}
