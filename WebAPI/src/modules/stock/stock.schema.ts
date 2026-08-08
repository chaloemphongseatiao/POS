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

export const receiveStockSchema = z.object({
  note,
  reference: z.string().trim().max(100).default(""),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive("จำนวนต้องมากกว่า 0").max(1_000_000),
        // Optional: a receipt can also correct the product's cost price.
        costPrice: z.number().nonnegative().max(10_000_000).optional(),
      })
    )
    .min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ")
    .max(200),
});
