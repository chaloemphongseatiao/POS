import { Request, Response, NextFunction } from "express";
import * as svc from "./promotions.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.listPromotions());
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await svc.createPromotion(req.body));
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.updatePromotion(Number(req.params.id), req.body));
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.deletePromotion(Number(req.params.id)));
  } catch (err) { next(err); }
}
