import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import type { PromotionInput } from "./promotions.schema";

export async function listPromotions() {
  return prisma.promotion.findMany({
    include: { products: { include: { product: { select: { id: true, name: true, barcode: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPromotion(data: PromotionInput) {
  return prisma.promotion.create({
    data: {
      name: data.name,
      type: data.type,
      value: data.value,
      minQty: data.minQty,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: data.isActive,
      products: { create: data.productIds.map((productId) => ({ productId })) },
    },
  });
}

export async function updatePromotion(id: number, data: PromotionInput) {
  const existing = await prisma.promotion.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw createError("ไม่พบโปรโมชัน", 404);

  return prisma.$transaction(async (tx) => {
    await tx.productPromotion.deleteMany({ where: { promotionId: id } });
    return tx.promotion.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        value: data.value,
        minQty: data.minQty,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        isActive: data.isActive,
        products: { create: data.productIds.map((productId) => ({ productId })) },
      },
    });
  });
}

export async function deletePromotion(id: number) {
  await prisma.promotion.delete({ where: { id } });
  return { id, deleted: true };
}
