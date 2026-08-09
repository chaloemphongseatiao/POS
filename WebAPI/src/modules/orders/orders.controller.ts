import { Request, Response, NextFunction } from "express";
import * as svc from "./orders.service";
import { numericParam } from "../../middleware/validate";
import { parseBangkok } from "../../lib/datetime";
import { isAdmin } from "../../lib/permissions";

type CostedOrder = {
  cost: unknown;
  items: { costPrice: unknown }[];
};

/**
 * Cost, profit and the per-line cost price are owner-only. Cashiers get the
 * same bill without any of the figures that would reveal the buying price.
 */
function visibleTo<T extends CostedOrder>(req: Request, order: T) {
  if (isAdmin(req)) return order;
  const { cost, items, ...rest } = order;
  return {
    ...rest,
    items: items.map(({ costPrice, ...item }) => item),
  };
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, page, limit } = req.query;
    const result = await svc.listOrders({
      from: parseBangkok(from as string | undefined),
      to: parseBangkok(to as string | undefined),
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ ...result, orders: result.orders.map((order) => visibleTo(req, order)) });
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(visibleTo(req, await svc.getOrder(numericParam(req, "id"))));
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(visibleTo(req, await svc.createOrder(req.user!.id, req.body)));
  } catch (err) { next(err); }
}

export async function voidOrder(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.voidOrder(numericParam(req, "id"), req.user!.id));
  } catch (err) { next(err); }
}
