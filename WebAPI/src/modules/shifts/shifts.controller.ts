import { Request, Response, NextFunction } from "express";
import * as svc from "./shifts.service";
import { numericParam } from "../../middleware/validate";
import { parseBangkok } from "../../lib/datetime";

export async function current(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getCurrentShift()); } catch (err) { next(err); }
}

export async function open(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await svc.openShift(req.user!.id, req.body));
  } catch (err) { next(err); }
}

export async function close(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.closeShift(req.user!.id, req.body));
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, page, limit } = req.query;
    res.json(
      await svc.listShifts({
        from: parseBangkok(from as string | undefined),
        to: parseBangkok(to as string | undefined),
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 30,
      })
    );
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getShift(numericParam(req, "id"))); } catch (err) { next(err); }
}
