import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        // Must be a positive integer: a negative quantity would push the order
        // subtotal down and let items be checked out for free.
        quantity: z.number().int().positive().max(9999),
      })
    )
    .min(1, "ไม่มีรายการสินค้า")
    .max(200, "รายการสินค้าต่อบิลมากเกินไป"),
  paymentMethod: z.enum(["CASH", "QR_PROMPT_PAY"]),
  amountPaid: z.number().nonnegative().max(10_000_000),
  discountAmt: z.number().nonnegative().max(10_000_000).default(0),
  note: z.string().trim().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
