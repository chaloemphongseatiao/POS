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

export const ledgerEntrySchema = z.object({
  categoryId: z.number().int().positive(),
  amount: z.number().positive().max(10_000_000),
  note: z.string().trim().max(500).optional(),
  entryDate: z
    .string()
    .trim()
    .regex(DATE_ONLY, "entryDate ต้องอยู่ในรูปแบบ YYYY-MM-DD")
    .transform((value) => bangkokDayStart(value)),
});

export type LedgerEntryInput = z.infer<typeof ledgerEntrySchema>;
