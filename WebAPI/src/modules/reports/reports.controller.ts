import { Request, Response, NextFunction } from "express";
import * as svc from "./reports.service";

function parseRange(req: Request) {
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from as string) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = req.query.to ? new Date(req.query.to as string) : now;
  return { from, to };
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = parseRange(req);
    res.json(await svc.getSummary(from, to));
  } catch (err) { next(err); }
}

export async function daily(req: Request, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    res.json(await svc.getDailyBreakdown(month, from, to));
  } catch (err) { next(err); }
}

export async function topProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = parseRange(req);
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    res.json(await svc.getTopProducts(from, to, limit));
  } catch (err) { next(err); }
}

export async function hourly(req: Request, res: Response, next: NextFunction) {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    res.json(await svc.getHourly(date));
  } catch (err) { next(err); }
}
