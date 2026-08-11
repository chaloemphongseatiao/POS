import { z } from "zod";
import { bangkokDayEnd, parseBangkok } from "../../lib/datetime";

const money = z.number().nonnegative().max(10_000_000);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `z.coerce.date()` reads a bare "YYYY-MM-DD" as UTC midnight, which is
 * already 07:00 in Bangkok — an expiry date set to "today" would count as
 * expired for most of that day. A bare date is pushed to the start of the
 * *next* Bangkok calendar day, so `getExpiryLoss`'s `expiryDate <= asOf`
 * only fires once the picked day has fully elapsed.
 */
const bangkokDate = z.preprocess((value) => {
  if (value === null || value === undefined || value instanceof Date) return value;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (DATE_ONLY.test(trimmed)) return bangkokDayEnd(trimmed);
  return parseBangkok(trimmed) ?? value;
}, z.date().nullable());

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
  reorderPoint: z.number().int().nonnegative().max(1_000_000).default(5),
  reorderQty: z.number().int().nonnegative().max(1_000_000).default(10),
  expiryDate: bangkokDate.optional(),
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
    reorderPoint: z.number().int().nonnegative().max(1_000_000),
    reorderQty: z.number().int().nonnegative().max(1_000_000),
    expiryDate: bangkokDate,
    categoryId: z.number().int().positive(),
    isActive: z.boolean(),
  })
  .partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
