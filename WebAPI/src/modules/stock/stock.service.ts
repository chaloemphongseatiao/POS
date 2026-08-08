import { Prisma } from "@prisma/client";
import type { MovementType } from "../../types/enums";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { publicProductImageUrl } from "../products/productImage";

type StockStatus = "normal" | "low" | "out" | "low_out";

/**
 * "low" and "normal" compare `Stock.quantity` against `Product.lowStockAt` —
 * two different columns, which the Prisma query API can't express. Filtering
 * and paging in SQL keeps this from loading the whole catalogue into memory
 * on every request.
 */
function stockFilterSql(params: { search?: string; categoryId?: number; status?: StockStatus }): Prisma.Sql {
  const conditions: Prisma.Sql[] = [Prisma.sql`p."isActive" = true`];

  if (params.categoryId) conditions.push(Prisma.sql`p."categoryId" = ${params.categoryId}`);

  if (params.search) {
    const like = `%${params.search}%`;
    conditions.push(Prisma.sql`(p."name" ILIKE ${like} OR p."barcode" ILIKE ${like})`);
  }

  switch (params.status) {
    case "out":
      conditions.push(Prisma.sql`s."quantity" <= 0`);
      break;
    case "low":
      conditions.push(Prisma.sql`s."quantity" > 0 AND s."quantity" <= p."lowStockAt"`);
      break;
    case "low_out":
      conditions.push(Prisma.sql`s."quantity" <= p."lowStockAt"`);
      break;
    case "normal":
      conditions.push(Prisma.sql`s."quantity" > p."lowStockAt"`);
      break;
  }

  return Prisma.sql`FROM "Stock" s JOIN "Product" p ON p."id" = s."productId" WHERE ${Prisma.join(
    conditions,
    " AND "
  )}`;
}

export async function listStock(params: {
  search?: string;
  categoryId?: number;
  lowOnly?: boolean;
  status?: StockStatus;
  page?: number;
  limit?: number;
} = {}) {
  const { search, categoryId, lowOnly, status } = params;
  const resolvedStatus = status ?? (lowOnly ? "low_out" : undefined);
  const safePage = Math.max(1, params.page ?? 1);
  const safeLimit = Math.min(50, Math.max(1, params.limit ?? 20));

  const filter = stockFilterSql({ search, categoryId, status: resolvedStatus });

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`SELECT COUNT(*)::bigint AS count ${filter}`),
    prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT s."id" ${filter} ORDER BY p."name" ASC, s."id" ASC LIMIT ${safeLimit} OFFSET ${
        (safePage - 1) * safeLimit
      }`
    ),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const stocks = await findStocksByIds(idRows.map((row) => row.id));

  return { stocks, total, page: safePage, limit: safeLimit };
}

async function findStocksByIds(ids: number[]) {
  if (ids.length === 0) return [];

  const stocks = await prisma.stock.findMany({
    where: { id: { in: ids } },
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
          updatedAt: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  return stocks.map((stock) => {
    const { updatedAt, ...product } = stock.product;
    return {
      ...stock,
      product: {
        ...product,
        imageUrl: publicProductImageUrl(product.id, product.imageUrl, updatedAt),
      },
    };
  });
}

export async function getLowStock() {
  const filter = stockFilterSql({ status: "low_out" });
  const idRows = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT s."id" ${filter} ORDER BY p."name" ASC LIMIT 500`
  );
  return findStocksByIds(idRows.map((row) => row.id));
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
