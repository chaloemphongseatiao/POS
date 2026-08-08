import { Request } from "express";

/** Cost prices, margins and profit are owner-only figures — cashiers never see them. */
export function isAdmin(req: Request): boolean {
  return req.user?.role === "ADMIN";
}
