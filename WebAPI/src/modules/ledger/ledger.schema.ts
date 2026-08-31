import { z } from "zod";
import { bangkokDayStart } from "../../lib/datetime";

const LEDGER_TYPE = z.enum(["INCOME", "EXPENSE"]);

export const ledgerCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: LEDGER_TYPE,
  isActive: z.boolean().default(true),
});

export type LedgerCategoryInput = z.infer<typeof ledgerCategorySchema>;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const dateOnly = z
  .string()
  .trim()
  .regex(DATE_ONLY, "วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD")
  .transform((value) => bangkokDayStart(value));

export const ledgerEntrySchema = z.object({
  categoryId: z.number().int().positive(),
  /** VAT-inclusive, like every other amount the shop types in. */
  amount: z.number().positive().max(10_000_000),
  /** Set when a tax invoice backs the amount, so its embedded VAT is claimable. */
  hasVat: z.boolean().default(false),
  note: z.string().trim().max(500).optional(),
  entryDate: dateOnly,
});

export type LedgerEntryInput = z.infer<typeof ledgerEntrySchema>;

export const recurringEntrySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    categoryId: z.number().int().positive(),
    amount: z.number().positive().max(10_000_000),
    hasVat: z.boolean().default(false),
    note: z.string().trim().max(500).optional(),
    frequency: z.enum(["MONTHLY", "WEEKLY"]),
    dayOf: z.number().int().min(0).max(31),
    startDate: dateOnly,
    endDate: dateOnly.optional(),
    isActive: z.boolean().default(true),
  })
  .refine((value) => (value.frequency === "WEEKLY" ? value.dayOf <= 6 : value.dayOf >= 1), {
    message: "วันที่กำหนดไม่ตรงกับรอบที่เลือก",
    path: ["dayOf"],
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม",
    path: ["endDate"],
  });

export type RecurringEntryInput = z.infer<typeof recurringEntrySchema>;
