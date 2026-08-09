/**
 * The shop's day is the Bangkok (UTC+7, no DST) calendar day — the same
 * boundary the API buckets every report on (`WebAPI/src/lib/datetime.ts`).
 * A UTC `toISOString()` slice names a different day between 00:00 and 07:00
 * Bangkok time, so "today" would ask for yesterday's figures and today's date
 * would not even be selectable in the pickers. Every date range the UI sends
 * goes through these helpers instead.
 */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" for the Bangkok calendar day the instant falls in. */
export function bangkokDateKey(date: Date): string {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** Today's Bangkok calendar day as "YYYY-MM-DD". */
export function bangkokToday(): string {
  return bangkokDateKey(new Date());
}

/** The Bangkok calendar day `days` before today — `bangkokDaysAgo(0)` is today. */
export function bangkokDaysAgo(days: number): string {
  return bangkokDateKey(new Date(Date.now() - days * DAY_MS));
}
