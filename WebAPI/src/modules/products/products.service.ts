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
