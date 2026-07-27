import type { PaymentMethod } from "../../types/enums";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { generateOrderNumber } from "../../lib/orderNumber";
import { sendLineOrderNotification } from "../../lib/line";

interface OrderItemInput {
  productId: number;
  quantity: number;
}

export async function listOrders(params: { from?: Date; to?: Date; page?: number; limit?: number }) {
  const { from, to, page = 1, limit = 50 } = params;
  const where = {
    ...(from || to
      ? { createdAt: { gte: from, lte: to } }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        cashier: { select: { displayName: true } },
        items: {
          include: { product: { select: { name: true, unit: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, limit };
}

export async function getOrder(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      cashier: { select: { displayName: true } },
      items: {
        include: { product: { select: { id: true, name: true, barcode: true, unit: true } } },
      },
    },
  });
  if (!order) throw createError("ไม่พบคำสั่งซื้อ", 404);
  return order;
}

export async function createOrder(
  cashierId: number,
  input: {
    items: OrderItemInput[];
    paymentMethod: PaymentMethod;
    amountPaid: number;
    discountAmt?: number;
    note?: string;
  }
) {
  const { items, paymentMethod, amountPaid, discountAmt = 0, note } = input;

  if (!items.length) throw createError("ไม่มีรายการสินค้า", 400);

  // Fetch products
  const products = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isActive: true },
      });
      if (!product) throw createError(`ไม่พบสินค้า ID ${item.productId}`, 404);
      return { product, quantity: item.quantity };
    })
  );

  const subtotal = products.reduce(
    (sum, { product, quantity }) => sum + Number(product.sellPrice) * quantity,
    0
  );
  const totalAmt = Math.max(0, subtotal - discountAmt);
  const changeAmt = amountPaid - totalAmt;

  if (changeAmt < 0) throw createError("จำนวนเงินที่รับมาไม่พอ", 400);

  const orderNumber = await generateOrderNumber();

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        subtotal,
        discountAmt,
        totalAmt,
        paymentMethod,
        amountPaid,
        changeAmt,
        note,
        cashierId,
        items: {
          create: products.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
            unitPrice: product.sellPrice,
            costPrice: product.costPrice ?? 0,
            subtotal: Number(product.sellPrice) * quantity,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { name: true, unit: true } } } },
        cashier: { select: { displayName: true } },
      },
    });

    // ส่ง LINE แจ้งเตือน (fire-and-forget — ไม่ block ถ้า LINE ล้มเหลว)
    sendLineOrderNotification({
      orderNumber: order.orderNumber,
      totalAmt: Number(order.totalAmt),
      paymentMethod: order.paymentMethod,
      itemCount: order.items.length,
      cashierName: order.cashier.displayName,
      changeAmt: Number(order.changeAmt),
    });

    return order;
  });
}

export async function voidOrder(id: number, adminId: number) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw createError("ไม่พบคำสั่งซื้อ", 404);
  if (order.status === "VOIDED") throw createError("คำสั่งซื้อนี้ถูกยกเลิกไปแล้ว", 400);

  await prisma.order.update({ where: { id }, data: { status: "VOIDED" } });

  return { id, orderNumber: order.orderNumber, status: "VOIDED" };
}
