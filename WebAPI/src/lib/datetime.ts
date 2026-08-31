/**
 * The store operates in Asia/Bangkok (UTC+7, no DST) while the API runs on UTC
 * hosts. Interpreting request dates or bucketing report rows with the server's
 * local clock shifts every figure by 7 hours — sales made between 00:00 and
 * 07:00 Bangkok time land on the previous day. Everything date-related goes
 * through these helpers so the boundaries match the shop's day.
 */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Parses a client-supplied date. A string that already carries a zone is
 * trusted as-is; a bare date or wall-clock timestamp is read as Bangkok time.
 * Returns undefined for anything unparseable so callers can fall back.
 */
export function parseBangkok(input: string | undefined): Date | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  let normalized: string;
  if (HAS_EXPLICIT_ZONE.test(trimmed)) {
    normalized = trimmed;
  } else if (DATE_ONLY.test(trimmed)) {
    normalized = `${trimmed}T00:00:00+07:00`;
  } else {
    normalized = `${trimmed}+07:00`;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Start of the given Bangkok calendar day (inclusive). */
export function bangkokDayStart(dateStr: string): Date {
  return parseBangkok(dateStr) ?? new Date(NaN);
}

/** Start of the day after the given Bangkok calendar day — use with `lt`. */
export function bangkokDayEnd(dateStr: string): Date {
  const start = bangkokDayStart(dateStr);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

/** "YYYY-MM-DD" for the Bangkok calendar day the instant falls in. */
export function bangkokDateKey(date: Date): string {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** Hour 0-23 of the Bangkok clock at the given instant. */
export function bangkokHour(date: Date): number {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).getUTCHours();
}

/** Today's Bangkok calendar day as "YYYY-MM-DD". */
export function bangkokToday(): string {
  return bangkokDateKey(new Date());
}

/** Current Bangkok month as "YYYY-MM". */
export function bangkokCurrentMonth(): string {
  return bangkokToday().slice(0, 7);
}

/**
 * The helpers below work on "YYYY-MM-DD" / "YYYY-MM" calendar strings rather
 * than instants. A recurring schedule ("the 1st of every month", "every
 * Monday") is a statement about the shop's calendar, so stepping it through
 * Date arithmetic on instants would drift across the UTC+7 boundary the same
 * way raw timestamps do. Stepping the string keeps every generated date on the
 * day the owner actually meant.
 */

function dayKeyToUtc(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Day of the week (0 = Sunday) of a "YYYY-MM-DD" calendar day. */
export function dayKeyWeekday(key: string): number {
  return new Date(dayKeyToUtc(key)).getUTCDay();
}

/** The "YYYY-MM-DD" that is `days` after the given one (negative goes back). */
export function addDayKey(key: string, days: number): string {
  return new Date(dayKeyToUtc(key) + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** The "YYYY-MM" that is `months` after the given one. */
export function addMonthKey(month: string, months: number): string {
  const [year, monthNo] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNo - 1 + months, 1));
  return shifted.toISOString().slice(0, 7);
}

/** How many days the "YYYY-MM" month has — 28 to 31. */
export function daysInMonthKey(month: string): number {
  const [year, monthNo] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNo, 0)).getUTCDate();
}

/** Inclusive [from, to] range covering a Bangkok month given as "YYYY-MM". */
export function bangkokMonthRange(month: string): { from: Date; to: Date } {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  const now = new Date(Date.now() + BANGKOK_OFFSET_MS);
  const year = match ? Number(match[1]) : now.getUTCFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : now.getUTCMonth();

  const from = new Date(Date.UTC(year, monthIndex, 1) - BANGKOK_OFFSET_MS);
  const to = new Date(Date.UTC(year, monthIndex + 1, 1) - BANGKOK_OFFSET_MS - 1);
  return { from, to };
}
