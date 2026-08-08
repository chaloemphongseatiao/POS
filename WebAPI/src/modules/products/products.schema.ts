import { z } from "zod";

const money = z.number().nonnegative().max(10_000_000);

/**
 * The product form submits blank fields as "" rather than omitting them. Stored
 * as-is, an empty `barcode` collides on the unique index as soon as a second
 * barcode-less product is added — so blanks are normalised to null.
 */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value ?? null;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z.string().max(max).nullable()
  );

export const createProductSchema = z.object({
  barcode: optionalText(64).optional(),
  name: z.string().trim().min(1, "ต้องระบุชื่อสินค้า").max(200),
  description: optionalText(1000).optional(),
  costPrice: money.default(0),
  sellPrice: money,
  unit: z.string().trim().min(1).max(32).default("ชิ้น"),
  imageUrl: optionalText(2_000_000).optional(),
  lowStockAt: z.number().int().nonnegative().max(1_000_000).default(5),
  categoryId: z.number().int().positive(),
  initialStock: z.number().int().nonnegative().max(1_000_000).default(0),
});

export const updateProductSchema = z
  .object({
    barcode: optionalText(64),
    name: z.string().trim().min(1).max(200),
    description: optionalText(1000),
    costPrice: money,
    sellPrice: money,
    unit: z.string().trim().min(1).max(32),
    imageUrl: optionalText(2_000_000),
    lowStockAt: z.number().int().nonnegative().max(1_000_000),
    categoryId: z.number().int().positive(),
    isActive: z.boolean(),
  })
  .partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
