import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { UserRole } from "../types/enums";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId, role: payload.role as UserRole };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
