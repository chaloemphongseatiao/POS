import { Response } from "express";

/**
 * Excel decides a CSV's encoding from a byte-order mark, not from the HTTP
 * charset — without this every Thai column opens as mojibake, which is the
 * whole point of the export for a Thai shop.
 */
const UTF8_BOM = "\uFEFF";

/** A plain number, a negative loss included — not something Excel can execute. */
const NUMERIC = /^-?\d+(\.\d+)?$/;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // A leading =, +, - or @ is read as a formula by Excel; prefixing a quote
  // keeps an exported note from executing when the owner opens the file. Real
  // numbers are exempt, or every negative total would import as text and break
  // the owner's own sums.
  const safe = /^[=+\-@]/.test(text) && !NUMERIC.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return UTF8_BOM + [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

/** Sends a CSV as a download. `filename` is ASCII-only so old clients don't mangle it. */
export function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}
