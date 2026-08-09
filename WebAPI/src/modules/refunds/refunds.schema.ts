import { z } from "zod";

export const createRefundSchema = z.object({
  orderId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        orderItemId: z.number().int().positive(),
        quantity: z.number().int().positive().max(9999),
      })
    )
    .min(1, "ไม่มีรายการที่จะคืน")
    .max(200),
  reason: z.string().trim().max(500).optional(),
  /** False when the goods come back damaged and must not re-enter stock. */
  restock: z.boolean().default(true),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
