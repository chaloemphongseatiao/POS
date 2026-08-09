import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { isProductImagePath, publicProductImageUrl } from "./productImage";
import type { CreateProductInput, UpdateProductInput } from "./products.schema";

const productSelect = {
  id: true,
  barcode: true,
  name: true,
  description: true,
  costPrice: true,
  sellPrice: true,
  unit: true,
  imageUrl: true,
  isActive: true,
  lowStockAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  stock: { select: { quantity: true } },
};

function withPublicImageUrl<T extends { id: number; imageUrl: string | null; updatedAt: Date }>(product: T) {
  const { updatedAt, ...publicProduct } = product;
  return {
    ...publicProduct,
    imageUrl: publicProductImageUrl(product.id, product.imageUrl, updatedAt),
  };
}

/** Cost price is owner-only; cashiers get the same payload without it. */
function forViewer<T extends { costPrice?: unknown }>(product: T, includeCost: boolean) {
  if (includeCost) return product;
  const { costPrice, ...rest } = product;
  return rest;
}

export async function listProducts(params: {
  search?: string;
  categoryId?: number;
  lowStock?: boolean;
  activeOnly?: boolean;
  includeCost?: boolean;
  page?: number;
  limit?: number;
}) {
  const { search, categoryId, lowStock, activeOnly = true, includeCost = false } = params;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(200, Math.max(1, params.limit ?? 20));
  const where = {
    isActive: activeOnly ? true : undefined,
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        // Postgres `contains` is a case-sensitive LIKE without this — searching
        // "coke" would miss a product named "Coke".
        { name: { contains: search, mode: "insensitive" as const } },
        { barcode: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => forViewer(withPublicImageUrl(p), includeCost)),
    total,
    page,
    limit,
  };
}

export async function getProductById(id: number, includeCost = false) {
  const p = await prisma.product.findUnique({ where: { id }, select: productSelect });
  if (!p) throw createError("ไม่พบสินค้า", 404);
  return forViewer(withPublicImageUrl(p), includeCost);
}

export async function getProductByBarcode(barcode: string, includeCost = false) {
  const p = await prisma.product.findUnique({
    where: { barcode, isActive: true },
    select: productSelect,
  });
  if (!p) throw createError("ไม่พบสินค้าที่มี barcode นี้", 404);
  return forViewer(withPublicImageUrl(p), includeCost);
}

export async function getProductImage(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  if (!product?.imageUrl) throw createError("ไม่พบรูปสินค้า", 404);
  return { imageUrl: product.imageUrl };
}

/**
 * Opening stock has to be logged as a movement, not just written to `Stock`.
 * The stock screen derives "รับเข้า"/"จ่ายออก" from the movement log, so a
 * quantity that appears without one leaves the two out of balance — a later
 * stocktake down to zero then reports the whole opening balance as issued.
 */
export async function createProduct(data: CreateProductInput, userId: number) {
  const { initialStock, ...rest } = data;
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: rest, select: productSelect });
    await tx.stock.create({ data: { productId: product.id, quantity: initialStock } });
    if (initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          type: "STOCK_IN",
          quantity: initialStock,
          note: "ยอดตั้งต้นตอนสร้างสินค้า",
          productId: product.id,
          userId,
        },
      });
    }
    return withPublicImageUrl(product);
  });
}

export async function updateProduct(id: number, data: UpdateProductInput) {
  const safeData = { ...data };
  // The client echoes back the served image path (/api/products/:id/image) for
  // products whose image is stored inline — writing that back would overwrite
  // the actual image data with its own URL.
  if (isProductImagePath(id, safeData.imageUrl)) delete safeData.imageUrl;
  const product = await prisma.product.update({ where: { id }, data: safeData, select: productSelect });
  return withPublicImageUrl(product);
}

export interface ProductImportRow {
  row: number;
  barcode?: string;
  name: string;
  description?: string;
  costPrice: number;
  sellPrice: number;
  unit: string;
  imageUrl?: string;
  lowStockAt: number;
  category: string;
  stock: number;
  isActive: boolean;
}

export async function importProducts(rows: ProductImportRow[], userId: number) {
  if (!Array.isArray(rows) || rows.length === 0)
    throw createError("ไม่พบข้อมูลสินค้าสำหรับ import", 400);
  if (rows.length > 5000)
    throw createError("Import ได้สูงสุด 5,000 รายการต่อครั้ง", 400);

  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryMap = new Map(categories.map((category) => [category.name.trim().toLocaleLowerCase(), category.id]));
  const seenBarcodes = new Set<string>();
  const errors: string[] = [];

  for (const item of rows) {
    if (!item.name?.trim()) errors.push(`แถว ${item.row}: ต้องระบุชื่อสินค้า`);
    if (!item.category?.trim()) errors.push(`แถว ${item.row}: ต้องระบุหมวดหมู่`);
    else if (!categoryMap.has(item.category.trim().toLocaleLowerCase()))
      errors.push(`แถว ${item.row}: ไม่พบหมวดหมู่ "${item.category}"`);
    if (!Number.isFinite(item.sellPrice) || item.sellPrice < 0)
      errors.push(`แถว ${item.row}: ราคาขายไม่ถูกต้อง`);
    if (!Number.isFinite(item.costPrice) || item.costPrice < 0)
      errors.push(`แถว ${item.row}: ราคาทุนไม่ถูกต้อง`);
    if (!Number.isInteger(item.stock) || item.stock < 0)
      errors.push(`แถว ${item.row}: Stock ต้องเป็นจำนวนเต็มตั้งแต่ 0`);
    if (!Number.isInteger(item.lowStockAt) || item.lowStockAt < 0)
      errors.push(`แถว ${item.row}: จุดแจ้งเตือนต้องเป็นจำนวนเต็มตั้งแต่ 0`);

    const barcode = item.barcode?.trim();
    if (barcode) {
      if (seenBarcodes.has(barcode)) errors.push(`แถว ${item.row}: Barcode "${barcode}" ซ้ำในไฟล์`);
      seenBarcodes.add(barcode);
    }
  }

  if (errors.length > 0) throw createError(errors.slice(0, 20).join("\n"), 400);

  return prisma.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;
    const movements: Prisma.StockMovementCreateManyInput[] = [];

    for (const item of rows) {
      const barcode = item.barcode?.trim() || null;
      const data = {
        barcode,
        name: item.name.trim(),
        description: item.description?.trim() || null,
        costPrice: item.costPrice,
        sellPrice: item.sellPrice,
        unit: item.unit?.trim() || "ชิ้น",
        imageUrl: item.imageUrl?.trim() || null,
        lowStockAt: item.lowStockAt,
        categoryId: categoryMap.get(item.category.trim().toLocaleLowerCase())!,
        isActive: item.isActive,
      };
      const existing = barcode
        ? await tx.product.findUnique({ where: { barcode }, select: { id: true } })
        : null;

      if (existing) {
        await tx.product.update({ where: { id: existing.id }, data });
        const current = await tx.stock.findUnique({
          where: { productId: existing.id },
          select: { quantity: true },
        });
        await tx.stock.upsert({
          where: { productId: existing.id },
          create: { productId: existing.id, quantity: item.stock },
          update: { quantity: item.stock },
        });
        // The sheet states what is on the shelf, so the difference is a
        // stocktake correction — logged like `importStock` does.
        const diff = item.stock - (current?.quantity ?? 0);
        if (diff !== 0) {
          movements.push({
            type: "ADJUST",
            quantity: diff,
            note: "นำเข้าสินค้าจาก Excel",
            productId: existing.id,
            userId,
          });
        }
        updated++;
      } else {
        const product = await tx.product.create({ data, select: { id: true } });
        await tx.stock.create({ data: { productId: product.id, quantity: item.stock } });
        if (item.stock > 0) {
          movements.push({
            type: "STOCK_IN",
            quantity: item.stock,
            note: "นำเข้าสินค้าจาก Excel",
            productId: product.id,
            userId,
          });
        }
        created++;
      }
    }

    if (movements.length > 0) await tx.stockMovement.createMany({ data: movements });

    return { total: rows.length, created, updated };
  });
}

export async function deleteProduct(id: number) {
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0)
    throw createError("ไม่สามารถลบสินค้าที่มีประวัติการขายได้", 409);

  return prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({ where: { productId: id } });
    await tx.stock.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
    return { id, deleted: true };
  });
}
