import { Request, Response, NextFunction } from "express";
import * as svc from "./categories.service";
import { numericParam } from "../../middleware/validate";

export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.listCategories()); } catch (err) { next(err); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await svc.createCategory(req.body.name)); } catch (err) { next(err); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.updateCategory(numericParam(req, "id"), req.body.name)); } catch (err) { next(err); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.deleteCategory(numericParam(req, "id")); res.status(204).send(); } catch (err) { next(err); }
}
