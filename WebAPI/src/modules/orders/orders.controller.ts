import { Request, Response, NextFunction } from "express";
import * as svc from "./orders.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, page, limit } = req.query;
    res.json(
      await svc.listOrders({
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      })
    );
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getOrder(Number(req.params.id))); } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await svc.createOrder(req.user!.id, req.body));
  } catch (err) { next(err); }
}

export async function voidOrder(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.voidOrder(Number(req.params.id), req.user!.id));
  } catch (err) { next(err); }
}
