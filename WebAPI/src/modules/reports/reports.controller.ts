import { Request, Response, NextFunction } from "express";
import * as svc from "./reports.service";
import { isAdmin } from "../../lib/permissions";
import {
  bangkokCurrentMonth,
  bangkokToday,
  bangkokMonthRange,
  parseBangkok,
} from "../../lib/datetime";

/**
 * Defaults to the current Bangkok month. Client-supplied bounds are read as
 * Bangkok wall-clock time unless they carry an explicit zone.
 */
function parseRange(req: Request) {
  const monthRange = bangkokMonthRange(bangkokCurrentMonth());
  return {
    from: parseBangkok(req.query.from as string | undefined) ?? monthRange.from,
    to: parseBangkok(req.query.to as string | undefined) ?? new Date(),
  };
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = parseRange(req);
    const result = await svc.getSummary(from, to);
    if (isAdmin(req)) {
      res.json(result);
      return;
    }
    // Cashiers get turnover figures only — never cost, profit or margin.
    const { cost, profit, margin, markup, ...visible } = result;
    res.json(visible);
  } catch (err) { next(err); }
}

export async function daily(req: Request, res: Response, next: NextFunction) {
  try {
    const month = (req.query.month as string) || bangkokCurrentMonth();
    const from = parseBangkok(req.query.from as string | undefined);
    const to = parseBangkok(req.query.to as string | undefined);
    const result = await svc.getDailyBreakdown(month, from, to);
    res.json(isAdmin(req) ? result : result.map(({ cost, ...visible }) => visible));
  } catch (err) { next(err); }
}

export async function topProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = parseRange(req);
    const requested = Number(req.query.limit);
    const limit = Number.isFinite(requested) ? Math.min(50, Math.max(1, requested)) : 10;
    const result = await svc.getTopProducts(from, to, limit);
    res.json(isAdmin(req) ? result : result.map(({ profit, cost, ...visible }) => visible));
  } catch (err) { next(err); }
}

export async function hourly(req: Request, res: Response, next: NextFunction) {
  try {
    const date = (req.query.date as string) || bangkokToday();
    res.json(await svc.getHourly(date));
  } catch (err) { next(err); }
}
