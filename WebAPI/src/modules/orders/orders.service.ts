import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { generateOrderNumber } from "../../lib/orderNumber";
import { sendLineOrderNotification } from "../../lib/line";
import type { CreateOrderInput } from "./orders.schema";

const MAX_ORDER_NUMBER_ATTEMPTS = 5;
const LINE_NOTIFY_TIMEOUT_MS = 3000;

/** Resolves with the work, or after `ms` — whichever lands first. Never rejects. */
async function withTimeout(work: Promise<void>, ms: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      work,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function listOrders(params: { from?: Date; to?: Date; page?: number; limit?: number }) {
  const { from, to } = params;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 50));
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

/** True when the write failed only because another register grabbed the same order number. */
function isDuplicateOrderNumber(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    JSON.stringify(err.meta?.target ?? "").includes("orderNumber")
  );
}

export async function createOrder(cashierId: number, input: CreateOrderInput) {
  const { items, paymentMethod, amountPaid, discountAmt, note } = input;

  const productIds = [...new Set(items.map((item) => item.productId))];
  const found = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const productById = new Map(found.map((product) => [product.id, product]));

  const missing = productIds.filter((id) => !productById.has(id));
  if (missing.length) throw createError(`ไม่พบสินค้า ID ${missing.join(", ")}`, 404);

  const lines = items.map((item) => ({
    product: productById.get(item.productId)!,
    quantity: item.quantity,
  }));

  const subtotal = lines.reduce(
    (sum, { product, quantity }) => sum + Number(product.sellPrice) * quantity,
    0
  );

  if (discountAmt > subtotal) throw createError("ส่วนลดมากกว่ายอดรวม", 400);

  const totalAmt = subtotal - discountAmt;
  const changeAmt = amountPaid - totalAmt;

  if (changeAmt < 0) throw createError("จำนวนเงินที่รับมาไม่พอ", 400);

  const order = await createOrderWithRetry({
    cashierId,
    lines,
    subtotal,
    discountAmt,
    totalAmt,
    paymentMethod,
    amountPaid,
    changeAmt,
    note,
  });

  // Awaited, not fire-and-forget: on a serverless host the invocation is frozen once
  // the response is flushed, so a detached push is killed before it reaches LINE. The
  // timeout keeps the original intent — a LINE outage must never stall a completed
  // sale — while still giving the push a chance to finish. Errors stay non-fatal: the
  // order is already committed and must be returned either way.
  await withTimeout(
    sendLineOrderNotification({
      orderNumber: order.orderNumber,
      totalAmt: Number(order.totalAmt),
      paymentMethod: order.paymentMethod,
      itemCount: order.items.length,
      cashierName: order.cashier.displayName,
      changeAmt: Number(order.changeAmt),
    })
      .then((results) => {
        for (const r of results.filter((x) => !x.ok)) {
          console.error(`[line] push failed for ${r.userId} on ${order.orderNumber}: ${r.error}`);
        }
      })
      .catch((err) => {
        console.error(`[line] notification failed for ${order.orderNumber}:`, err?.message ?? err);
      }),
    LINE_NOTIFY_TIMEOUT_MS
  );

  return order;
}

async function createOrderWithRetry(data: {
  cashierId: number;
  lines: { product: { id: number; sellPrice: Prisma.Decimal; costPrice: Prisma.Decimal }; quantity: number }[];
  subtotal: number;
  discountAmt: number;
  totalAmt: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmt: number;
  note?: string;
}) {
  for (let attempt = 1; ; attempt++) {
    const orderNumber = await generateOrderNumber();
    try {
      return await prisma.order.create({
        data: {
          orderNumber,
          subtotal: data.subtotal,
          discountAmt: data.discountAmt,
          totalAmt: data.totalAmt,
          paymentMethod: data.paymentMethod,
          amountPaid: data.amountPaid,
          changeAmt: data.changeAmt,
          note: data.note,
          cashierId: data.cashierId,
          items: {
            create: data.lines.map(({ product, quantity }) => ({
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
    } catch (err) {
      // Two registers can read the same "latest" order number; retry with the
      // next one instead of failing the sale with a 409.
      if (isDuplicateOrderNumber(err) && attempt < MAX_ORDER_NUMBER_ATTEMPTS) continue;
      throw err;
    }
  }
}

export async function voidOrder(id: number, adminId: number) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw createError("ไม่พบคำสั่งซื้อ", 404);
  if (order.status === "VOIDED") throw createError("คำสั่งซื้อนี้ถูกยกเลิกไปแล้ว", 400);

  await prisma.order.update({ where: { id }, data: { status: "VOIDED" } });

  return { id, orderNumber: order.orderNumber, status: "VOIDED" };
}
