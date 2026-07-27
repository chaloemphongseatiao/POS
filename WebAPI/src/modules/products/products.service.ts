import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";

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
  category: { select: { id: true, name: true } },
  stock: { select: { quantity: true } },
};

export async function listProducts(params: {
  search?: string;
  categoryId?: number;
  lowStock?: boolean;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const { search, categoryId, lowStock, activeOnly = true, page = 1, limit = 20 } = params;
  const where = {
    isActive: activeOnly ? true : undefined,
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [{ name: { contains: search } }, { barcode: { contains: search } }],
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

  return { products, total, page, limit };
}

export async function getProductById(id: number) {
  const p = await prisma.product.findUnique({ where: { id }, select: productSelect });
  if (!p) throw createError("ไม่พบสินค้า", 404);
  return p;
}

export async function getProductByBarcode(barcode: string) {
  const p = await prisma.product.findUnique({
    where: { barcode, isActive: true },
    select: productSelect,
  });
  if (!p) throw createError("ไม่พบสินค้าที่มี barcode นี้", 404);
  return p;
}

export async function createProduct(data: {
  barcode?: string;
  name: string;
  description?: string;
  costPrice?: number;
  sellPrice: number;
  unit: string;
  imageUrl?: string;
  lowStockAt: number;
  categoryId: number;
  initialStock?: number;
}) {
  const { initialStock = 0, costPrice = 0, ...rest } = data;
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: { ...rest, costPrice }, select: productSelect });
    await tx.stock.create({ data: { productId: product.id, quantity: initialStock } });
    return product;
  });
}

export async function updateProduct(
  id: number,
  data: Partial<{
    barcode: string;
    name: string;
    description: string;
    costPrice: number;
    sellPrice: number;
    unit: string;
    imageUrl: string;
    lowStockAt: number;
    categoryId: number;
    isActive: boolean;
  }>
) {
  return prisma.product.update({ where: { id }, data, select: productSelect });
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

export async function importProducts(rows: ProductImportRow[]) {
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
        await tx.stock.upsert({
          where: { productId: existing.id },
          create: { productId: existing.id, quantity: item.stock },
          update: { quantity: item.stock },
        });
        updated++;
      } else {
        const product = await tx.product.create({ data, select: { id: true } });
        await tx.stock.create({ data: { productId: product.id, quantity: item.stock } });
        created++;
      }
    }

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
