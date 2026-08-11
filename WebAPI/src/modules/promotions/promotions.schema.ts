import { z } from "zod";
import { bangkokDayEnd, parseBangkok } from "../../lib/datetime";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `z.coerce.date()` reads a bare "YYYY-MM-DD" as UTC midnight — 07:00 in
 * Bangkok — so a promotion set to end "today" would expire before most of
 * that day has happened. A bare date is read as the start of that Bangkok
 * calendar day; for `endsAt` it's pushed to the start of the *next* day so
 * the promotion stays active through the whole day the admin picked (the
 * `endsAt >= now` check in `orders.service.ts` stays true until then).
 */
function dateValue(edge: "start" | "end") {
  return z.preprocess((value) => {
    if (value === null || value === undefined || value instanceof Date) return value;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (trimmed === "") return null;
    if (edge === "end" && DATE_ONLY.test(trimmed)) return bangkokDayEnd(trimmed);
    return parseBangkok(trimmed) ?? value;
  }, z.date().nullable().optional());
}

export const promotionSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(["PERCENT_OFF", "AMOUNT_OFF"]),
  value: z.number().positive().max(10_000_000),
  minQty: z.number().int().positive().max(9999).default(1),
  startsAt: dateValue("start"),
  endsAt: dateValue("end"),
  isActive: z.boolean().default(true),
  productIds: z.array(z.number().int().positive()).min(1),
});

export type PromotionInput = z.infer<typeof promotionSchema>;
