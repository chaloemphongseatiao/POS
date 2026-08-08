import { Request, Response, NextFunction } from "express";
import * as svc from "./orders.service";
import { numericParam } from "../../middleware/validate";
import { parseBangkok } from "../../lib/datetime";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, page, limit } = req.query;
    res.json(
      await svc.listOrders({
        from: parseBangkok(from as string | undefined),
        to: parseBangkok(to as string | undefined),
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      })
    );
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getOrder(numericParam(req, "id"))); } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await svc.createOrder(req.user!.id, req.body));
  } catch (err) { next(err); }
}

export async function voidOrder(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.voidOrder(numericParam(req, "id"), req.user!.id));
  } catch (err) { next(err); }
}
