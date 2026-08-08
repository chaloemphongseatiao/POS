import { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service";
import { numericParam } from "../../middleware/validate";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.listUsers());
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.updateUser(numericParam(req, "id"), req.body));
  } catch (err) { next(err); }
}

export async function toggle(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await usersService.toggleUser(numericParam(req, "id"), req.user!.id));
  } catch (err) { next(err); }
}
