import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/enums";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}
