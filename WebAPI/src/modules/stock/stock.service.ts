import type { MovementType } from "../../types/enums";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";

export async function listStock(params: {
  search?: string;
  categoryId?: number;
  lowOnly?: boolean;
  status?: "normal" | "low" | "out" | "low_out";
  page?: number;
  limit?: number;
} = {}) {
  const { search, categoryId, lowOnly, status, page = 1, limit = 20 } = params;

  const resolvedStatus = status ?? (lowOnly ? "low_out" : undefined);

  const where: any = {
    // "out" กรองที่ DB level ได้โดยตรง
    ...(resolvedStatus === "out" && { quantity: { lte: 0 } }),
    product: {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { barcode: { contains: search } },
        ],
      }),
    },
  };

  const allStocks = await prisma.stock.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          barcode: true,
          name: true,
          unit: true,
          lowStockAt: true,
          isActive: true,
          imageUrl: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  // กรอง low/normal/low_out หลัง query เพราะต้องเปรียบเทียบ quantity กับ lowStockAt (column อื่น)
  const filtered =
    resolvedStatus === "low"
      ? allStocks.filter((s) => s.quantity > 0 && s.quantity <= s.product.lowStockAt)
      : resolvedStatus === "low_out"
      ? allStocks.filter((s) => s.quantity <= s.product.lowStockAt)
      : resolvedStatus === "normal"
      ? allStocks.filter((s) => s.quantity > s.product.lowStockAt)
      : allStocks; // "out" กรองที่ DB แล้ว / ไม่มี filter

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return { stocks: paginated, total, page, limit };
}

export async function getLowStock() {
  const stocks = await prisma.stock.findMany({
    include: {
      product: {
        select: { id: true, name: true, barcode: true, unit: true, lowStockAt: true },
      },
    },
  });
  return stocks.filter((s) => s.quantity <= s.product.lowStockAt);
}

export async function getMovements(productId: number) {
  return prisma.stockMovement.findMany({
    where: { productId },
    include: {
      user: { select: { displayName: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getAllMovements(params: {
  productId?: number;
  type?: MovementType;
  from?: Date;
  to?: Date;
}) {
  return prisma.stockMovement.findMany({
    where: {
      ...(params.productId && { productId: params.productId }),
      ...(params.type && { type: params.type }),
      ...(params.from || params.to
        ? { createdAt: { gte: params.from, lte: params.to } }
        : {}),
    },
    include: {
      product: { select: { id: true, name: true, barcode: true } },
      user: { select: { displayName: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function stockIn(productId: number, quantity: number, note: string, userId: number) {
  if (quantity <= 0) throw createError("จำนวนต้องมากกว่า 0", 400);

  return prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({ where: { productId } });
    if (!stock) throw createError("ไม่พบ stock ของสินค้านี้", 404);

    await tx.stock.update({
      where: { productId },
      data: { quantity: { increment: quantity } },
    });

    return tx.stockMovement.create({
      data: { type: "STOCK_IN", quantity, note, productId, userId },
    });
  });
}

export async function adjustStock(
  productId: number,
  newQuantity: number,
  note: string,
  userId: number
) {
  if (newQuantity < 0) throw createError("จำนวนต้องไม่ติดลบ", 400);

  return prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({ where: { productId } });
    if (!stock) throw createError("ไม่พบ stock ของสินค้านี้", 404);

    const diff = newQuantity - stock.quantity;
    await tx.stock.update({ where: { productId }, data: { quantity: newQuantity } });

    return tx.stockMovement.create({
      data: { type: "ADJUST", quantity: diff, note, productId, userId },
    });
  });
}
