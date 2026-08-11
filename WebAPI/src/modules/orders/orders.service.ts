import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { createError } from "../../middleware/errorHandler";
import { generateOrderNumber } from "../../lib/orderNumber";
import { sendLineOrderNotification } from "../../lib/line";
import { orderCost } from "../../lib/profit";
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

  return { orders: orders.map(withCost), total, page, limit };
}

/** Every bill leaves the service costed; the controller strips it for cashiers. */
function withCost<T extends Parameters<typeof orderCost>[0]>(order: T) {
  return { ...order, cost: orderCost(order) };
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
  return withCost(order);
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
    include: { stock: { select: { quantity: true } } },
  });
  const productById = new Map(found.map((product) => [product.id, product]));

  const missing = productIds.filter((id) => !productById.has(id));
  if (missing.length) throw createError(`ไม่พบสินค้า ID ${missing.join(", ")}`, 404);

  const lines = items.map((item) => ({
    product: productById.get(item.productId)!,
    quantity: item.quantity,
  }));

  // The same product can appear on several lines; stock is checked and
  // deducted against the bill's total for that product, not per line.
  const demandByProduct = new Map<number, number>();
  for (const item of items) {
    demandByProduct.set(item.productId, (demandByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  for (const [productId, demand] of demandByProduct) {
    const product = productById.get(productId)!;
    const onHand = product.stock?.quantity ?? 0;
    if (onHand < demand) {
      throw createError(
        onHand <= 0
          ? `สินค้า "${product.name}" หมดสต็อก`
          : `สินค้า "${product.name}" คงเหลือ ${onHand} ${product.unit} ไม่พอขาย ${demand}`,
        400
      );
    }
  }

  const subtotal = lines.reduce(
    (sum, { product, quantity }) => sum + Number(product.sellPrice) * quantity,
    0
  );

  const promoDiscount = await promotionDiscount(productIds, demandByProduct, productById);
  const totalDiscount = discountAmt + promoDiscount;

  if (totalDiscount > subtotal) throw createError("ส่วนลดมากกว่ายอดรวม", 400);

  const totalAmt = subtotal - totalDiscount;
  const changeAmt = amountPaid - totalAmt;

  if (changeAmt < 0) throw createError("จำนวนเงินที่รับมาไม่พอ", 400);

  const order = await createOrderWithRetry({
    cashierId,
    lines,
    demandByProduct,
    productNameById: new Map(found.map((product) => [product.id, product.name])),
    subtotal,
    discountAmt: totalDiscount,
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
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        subtotal: Number(item.subtotal),
      })),
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

  return withCost(order);
}

async function promotionDiscount(
  productIds: number[],
  demandByProduct: Map<number, number>,
  productById: Map<number, { id: number; sellPrice: Prisma.Decimal }>
) {
  const now = new Date();
  const links = await prisma.productPromotion.findMany({
    where: {
      productId: { in: productIds },
      promotion: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
    },
    include: { promotion: true },
  });

  // A product can carry more than one active promotion at once, so discounts
  // are summed per product first and only then capped against that product's
  // subtotal — capping each promotion separately would let two overlapping
  // promotions discount the same line by more than 100% of its value.
  const rawDiscountByProduct = new Map<number, number>();
  for (const link of links) {
    const qty = demandByProduct.get(link.productId) ?? 0;
    if (qty < link.promotion.minQty) continue;
    const product = productById.get(link.productId);
    if (!product) continue;
    const lineSubtotal = Number(product.sellPrice) * qty;
    const value = Number(link.promotion.value);
    const lineDiscount =
      link.promotion.type === "PERCENT_OFF"
        ? lineSubtotal * Math.min(value, 100) / 100
        : value * Math.floor(qty / link.promotion.minQty);
    rawDiscountByProduct.set(link.productId, (rawDiscountByProduct.get(link.productId) ?? 0) + lineDiscount);
  }

  let discount = 0;
  for (const [productId, rawDiscount] of rawDiscountByProduct) {
    const qty = demandByProduct.get(productId) ?? 0;
    const product = productById.get(productId);
    if (!product) continue;
    const lineSubtotal = Number(product.sellPrice) * qty;
    discount += Math.min(lineSubtotal, rawDiscount);
  }
  return Math.round(discount * 100) / 100;
}

async function createOrderWithRetry(data: {
  cashierId: number;
  lines: { product: { id: number; sellPrice: Prisma.Decimal; costPrice: Prisma.Decimal }; quantity: number }[];
  /** Total quantity sold per product on this bill — what comes off the shelf. */
  demandByProduct: Map<number, number>;
  productNameById: Map<number, string>;
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
      return await prisma.$transaction(async (tx) => {
        // The availability check in `createOrder` runs before the transaction,
        // so a second register can sell the last unit in between. The `gte`
        // guard makes the deduction itself the check: it matches no row when
        // the shelf has run short, and the sale is rejected instead of
        // driving stock negative.
        for (const [productId, quantity] of data.demandByProduct) {
          const { count } = await tx.stock.updateMany({
            where: { productId, quantity: { gte: quantity } },
            data: { quantity: { decrement: quantity } },
          });
          if (count === 0) {
            throw createError(
              `สินค้า "${data.productNameById.get(productId) ?? productId}" คงเหลือไม่พอขาย`,
              400
            );
          }
        }

        const order = await tx.order.create({
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

        // Outgoing stock is written as a negative quantity, the same sign
        // convention `ADJUST` movements use.
        await tx.stockMovement.createMany({
          data: [...data.demandByProduct].map(([productId, quantity]) => ({
            type: "SALE",
            quantity: -quantity,
            productId,
            userId: data.cashierId,
            orderId: order.id,
          })),
        });

        return order;
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
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!order) throw createError("ไม่พบคำสั่งซื้อ", 404);
  if (order.status === "VOIDED") throw createError("คำสั่งซื้อนี้ถูกยกเลิกไปแล้ว", 400);
  // Part of this bill has already come back through a refund. Voiding it now
  // would restock those units a second time, so the refund path owns it.
  if (order.status !== "COMPLETED") {
    throw createError("บิลนี้มีการคืนสินค้าแล้ว ยกเลิกทั้งบิลไม่ได้", 400);
  }

  // The sale took the goods off the shelf, so voiding it must put them back.
  const returnedByProduct = new Map<number, number>();
  for (const item of order.items) {
    returnedByProduct.set(
      item.productId,
      (returnedByProduct.get(item.productId) ?? 0) + item.quantity
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: "VOIDED" } });

    for (const [productId, quantity] of returnedByProduct) {
      await tx.stock.upsert({
        where: { productId },
        create: { productId, quantity },
        update: { quantity: { increment: quantity } },
      });
    }

    await tx.stockMovement.createMany({
      data: [...returnedByProduct].map(([productId, quantity]) => ({
        type: "ADJUST",
        quantity,
        note: `ยกเลิกบิล ${order.orderNumber}`,
        productId,
        userId: adminId,
        orderId: order.id,
      })),
    });
  });

  return { id, orderNumber: order.orderNumber, status: "VOIDED" };
}
