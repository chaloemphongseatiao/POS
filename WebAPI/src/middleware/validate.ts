import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { createError } from "./errorHandler";

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
    .join(", ");
}

/**
 * Parses `req.body` with the schema and replaces it with the parsed value, so
 * controllers hand services typed data instead of whatever the client sent.
 * Without this, unvalidated fields flow straight into Prisma.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      next(createError(formatZodError(parsed.error), 400));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

/** Route params are always strings; this validates the common `:id`-style numeric param. */
export function numericParam(req: Request, name: string): number {
  const value = Number(req.params[name]);
  if (!Number.isInteger(value) || value <= 0) {
    throw createError(`พารามิเตอร์ ${name} ไม่ถูกต้อง`, 400);
  }
  return value;
}
