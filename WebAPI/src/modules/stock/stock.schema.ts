import { z } from "zod";

const note = z.string().trim().max(500).default("");

export const stockInSchema = z.object({
  quantity: z.number().int().positive("จำนวนต้องมากกว่า 0").max(1_000_000),
  note,
});

export const adjustStockSchema = z.object({
  quantity: z.number().int().nonnegative("จำนวนต้องไม่ติดลบ").max(1_000_000),
  note,
});
