import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { generateRefundNumber } from "../../lib/orderNumber";
import { getOpenShiftId } from "../shifts/shifts.service";
import type { CreateRefundInput } from "./refunds.schema";

const MAX_REFUND_NUMBER_ATTEMPTS = 5;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isDuplicateRefundNumber(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    JSON.stringify(err.meta?.target ?? "").includes("refundNumber")
  );
}

export async function listRefunds(params: { from?: Date; to?: Date; page?: number; limit?: number }) {
  const { from, to } = params;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 50));
  const where = from || to ? { createdAt: { gte: from, lte: to } } : {};

  const [refunds, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      include: {
        user: { select: { displayName: true } },
        order: { select: { orderNumber: true, paymentMethod: true } },
        items: { include: { product: { select: { name: true, unit: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.refund.count({ where }),
  ]);

  return { refunds, total, page, limit };
}

export async function getRefundsForOrder(orderId: number) {
  return prisma.refund.findMany({
    where: { orderId },
    include: {
      user: { select: { displayName: true } },
      items: { include: { product: { select: { name: true, unit: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRefund(userId: number, input: CreateRefundInput) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: true },
  });
  if (!order) throw createError("ไม่พบคำสั่งซื้อ", 404);
  if (order.status === "VOIDED") throw createError("บิลนี้ถูกยกเลิกไปแล้ว คืนสินค้าไม่ได้", 400);

  const itemById = new Map(order.items.map((item) => [item.id, item]));

  // One line may be listed twice; validate against the request's total per line.
  const wantedByItem = new Map<number, number>();
  for (const line of input.items) {
    wantedByItem.set(line.orderItemId, (wantedByItem.get(line.orderItemId) ?? 0) + line.quantity);
  }

  for (const [orderItemId, quantity] of wantedByItem) {
    const item = itemById.get(orderItemId);
    if (!item) throw createError(`รายการ ID ${orderItemId} ไม่ได้อยู่ในบิลนี้`, 400);
    const remaining = item.quantity - item.refundedQty;
    if (quantity > remaining) {
      throw createError(
        remaining <= 0
          ? "รายการนี้ถูกคืนครบแล้ว"
          : `คืนได้ไม่เกิน ${remaining} จากรายการนี้`,
        400
      );
    }
  }

  // A bill-level discount belongs to every line, so a return pays back the
  // discounted share — refunding at the sticker price would hand back more
  // money than the customer paid.
  const subtotal = Number(order.subtotal);
  const paidRatio = subtotal > 0 ? Number(order.totalAmt) / subtotal : 0;

  const lines = [...wantedByItem].map(([orderItemId, quantity]) => {
    const item = itemById.get(orderItemId)!;
    return {
      orderItemId,
      productId: item.productId,
      quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      subtotal: round2(Number(item.unitPrice) * quantity * paidRatio),
      cost: round2(Number(item.costPrice ?? 0) * quantity),
    };
  });

  const totalAmt = round2(lines.reduce((sum, line) => sum + line.subtotal, 0));
  const totalCost = round2(lines.reduce((sum, line) => sum + line.cost, 0));

  const shiftId = await getOpenShiftId();

  for (let attempt = 1; ; attempt++) {
    const refundNumber = await generateRefundNumber();
    try {
      return await prisma.$transaction(async (tx) => {
        // The remaining-quantity check above ran outside the transaction, so a
        // second terminal could refund the same line in between. The `lte`
        // guard makes the increment itself the check.
        for (const line of lines) {
          const item = itemById.get(line.orderItemId)!;
          const { count } = await tx.orderItem.updateMany({
            where: {
              id: line.orderItemId,
              refundedQty: { lte: item.quantity - line.quantity },
            },
            data: { refundedQty: { increment: line.quantity } },
          });
          if (count === 0) throw createError("รายการนี้ถูกคืนไปแล้ว", 409);
        }

        const refund = await tx.refund.create({
          data: {
            refundNumber,
            totalAmt,
            totalCost,
            reason: input.reason,
            restock: input.restock,
            orderId: order.id,
            userId,
            shiftId,
            items: {
              create: lines.map((line) => ({
                orderItemId: line.orderItemId,
                productId: line.productId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                costPrice: line.costPrice,
                subtotal: line.subtotal,
              })),
            },
          },
          include: {
            items: { include: { product: { select: { name: true, unit: true } } } },
            user: { select: { displayName: true } },
            order: { select: { orderNumber: true, paymentMethod: true } },
          },
        });

        if (input.restock) {
          // Returned goods go back on the shelf, mirroring what the sale took off.
          const returnedByProduct = new Map<number, number>();
          for (const line of lines) {
            returnedByProduct.set(
              line.productId,
              (returnedByProduct.get(line.productId) ?? 0) + line.quantity
            );
          }

          for (const [productId, quantity] of returnedByProduct) {
            await tx.stock.upsert({
              where: { productId },
              create: { productId, quantity },
              update: { quantity: { increment: quantity } },
            });
          }

          await tx.stockMovement.createMany({
            data: [...returnedByProduct].map(([productId, quantity]) => ({
              type: "RETURN",
              quantity,
              note: `คืนสินค้า ${refundNumber} (บิล ${order.orderNumber})`,
              productId,
              userId,
              orderId: order.id,
            })),
          });
        }

        // A bill whose every line has come back is fully refunded; anything
        // less leaves it partially refunded.
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
          select: { quantity: true, refundedQty: true },
        });
        const fully = items.every((item) => item.refundedQty >= item.quantity);
        await tx.order.update({
          where: { id: order.id },
          data: { status: fully ? "REFUNDED" : "PARTIAL_REFUND" },
        });

        return refund;
      });
    } catch (err) {
      if (isDuplicateRefundNumber(err) && attempt < MAX_REFUND_NUMBER_ATTEMPTS) continue;
      throw err;
    }
  }
}
