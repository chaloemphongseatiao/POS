import { prisma } from "../../lib/prisma";
import { bangkokDateKey, bangkokDayEnd, bangkokDayStart, bangkokHour, bangkokMonthRange } from "../../lib/datetime";
import { marginPct, markupPct, orderCost } from "../../lib/profit";

/**
 * Bills that count towards sales. A partially or fully refunded bill still
 * happened — its returned lines are subtracted separately through the refund
 * records, so filtering on "COMPLETED" alone would drop real revenue. Only a
 * voided bill never happened at all.
 */
const SOLD = { status: { not: "VOIDED" } };

export async function getSummary(from: Date, to: Date) {
  const [orders, refunds] = await Promise.all([
    prisma.order.findMany({
      where: { ...SOLD, createdAt: { gte: from, lte: to } },
      include: { items: true },
    }),
    prisma.refund.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { totalAmt: true, totalCost: true },
    }),
  ]);

  let revenue = 0;
  let cost = 0;
  for (const order of orders) {
    revenue += Number(order.totalAmt);
    for (const item of order.items) {
      cost += Number(item.costPrice ?? 0) * item.quantity;
    }
  }

  let refundTotal = 0;
  for (const refund of refunds) {
    refundTotal += Number(refund.totalAmt);
    // Returned goods are back on the shelf, so their cost is no longer a cost of sale.
    cost -= Number(refund.totalCost);
  }
  revenue -= refundTotal;

  const profit = revenue - cost;

  return {
    revenue,
    cost,
    profit,
    margin: marginPct(revenue, profit),
    /** Profit measured against what the goods cost, not against the sale price. */
    markup: markupPct(cost, profit),
    orderCount: orders.length,
    refundTotal,
    refundCount: refunds.length,
    from,
    to,
  };
}

export async function getDailyBreakdown(month: string, fromDate?: Date, toDate?: Date) {
  const range =
    fromDate && toDate ? { from: fromDate, to: toDate } : bangkokMonthRange(month);

  const [orders, refunds] = await Promise.all([
    prisma.order.findMany({
      where: { ...SOLD, createdAt: { gte: range.from, lte: range.to } },
      include: { items: true },
    }),
    prisma.refund.findMany({
      where: { createdAt: { gte: range.from, lte: range.to } },
      select: { createdAt: true, totalAmt: true, totalCost: true },
    }),
  ]);

  const map: Record<
    string,
    { date: string; revenue: number; cost: number; orders: number; refunds: number }
  > = {};

  const bucket = (date: string) => {
    if (!map[date]) map[date] = { date, revenue: 0, cost: 0, orders: 0, refunds: 0 };
    return map[date];
  };

  for (const order of orders) {
    // Bucketed by Bangkok calendar day, not the server's UTC day.
    const day = bucket(bangkokDateKey(order.createdAt));
    day.revenue += Number(order.totalAmt);
    day.orders += 1;
    for (const item of order.items) {
      day.cost += Number(item.costPrice) * item.quantity;
    }
  }

  // A refund lands on the day it was given, not the day of the original sale.
  for (const refund of refunds) {
    const day = bucket(bangkokDateKey(refund.createdAt));
    day.revenue -= Number(refund.totalAmt);
    day.cost -= Number(refund.totalCost);
    day.refunds += Number(refund.totalAmt);
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTopProducts(from: Date, to: Date, limit = 10) {
  const [items, refundItems] = await Promise.all([
    prisma.orderItem.findMany({
      where: { order: { ...SOLD, createdAt: { gte: from, lte: to } } },
      include: { product: { select: { id: true, name: true, unit: true } } },
    }),
    prisma.refundItem.findMany({
      where: { refund: { createdAt: { gte: from, lte: to } } },
      include: { product: { select: { id: true, name: true, unit: true } } },
    }),
  ]);

  const map: Record<
    number,
    {
      productId: number;
      name: string;
      unit: string;
      qty: number;
      revenue: number;
      cost: number;
      profit: number;
    }
  > = {};

  const bucket = (product: { id: number; name: string; unit: string }) => {
    if (!map[product.id]) {
      map[product.id] = {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        qty: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
    }
    return map[product.id];
  };

  for (const item of items) {
    const row = bucket(item.product);
    row.qty += item.quantity;
    row.revenue += Number(item.subtotal);
    row.cost += Number(item.costPrice ?? 0) * item.quantity;
    row.profit += (Number(item.unitPrice) - Number(item.costPrice ?? 0)) * item.quantity;
  }

  // Returned units are not sales: they come off the quantity and the money.
  for (const item of refundItems) {
    const row = bucket(item.product);
    row.qty -= item.quantity;
    row.revenue -= Number(item.subtotal);
    row.cost -= Number(item.costPrice ?? 0) * item.quantity;
    row.profit -= (Number(item.unitPrice) - Number(item.costPrice ?? 0)) * item.quantity;
  }

  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getHourly(date: string) {
  const range = { gte: bangkokDayStart(date), lt: bangkokDayEnd(date) };

  const [orders, refunds] = await Promise.all([
    prisma.order.findMany({ where: { ...SOLD, createdAt: range } }),
    prisma.refund.findMany({
      where: { createdAt: range },
      select: { createdAt: true, totalAmt: true },
    }),
  ]);

  const hours: Record<number, { hour: number; revenue: number; orders: number }> = {};
  for (let h = 0; h < 24; h++) {
    hours[h] = { hour: h, revenue: 0, orders: 0 };
  }

  for (const order of orders) {
    const h = bangkokHour(order.createdAt);
    hours[h].revenue += Number(order.totalAmt);
    hours[h].orders += 1;
  }

  for (const refund of refunds) {
    hours[bangkokHour(refund.createdAt)].revenue -= Number(refund.totalAmt);
  }

  return Object.values(hours);
}

export async function getSalesOverview(from: Date, to: Date) {
  const [orders, refunds] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.refund.findMany({ where: { createdAt: { gte: from, lte: to } } }),
  ]);

  const grossSales = orders
    .filter((order) => order.status !== "VOIDED")
    .reduce((sum, order) => sum + Number(order.subtotal), 0);
  const discounts = orders
    .filter((order) => order.status !== "VOIDED")
    .reduce((sum, order) => sum + Number(order.discountAmt), 0);
  const refundTotal = refunds.reduce((sum, refund) => sum + Number(refund.totalAmt), 0);
  const voidTotal = orders
    .filter((order) => order.status === "VOIDED")
    .reduce((sum, order) => sum + Number(order.totalAmt), 0);

  return {
    grossSales,
    discounts,
    refundTotal,
    voidTotal,
    netSales: grossSales - discounts - refundTotal,
    orderCount: orders.length,
    voidCount: orders.filter((order) => order.status === "VOIDED").length,
    refundCount: refunds.length,
  };
}

export async function getRefundVoidReport(from: Date, to: Date) {
  const [refunds, voided] = await Promise.all([
    prisma.refund.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { user: { select: { displayName: true } }, order: { select: { orderNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.order.findMany({
      where: { status: "VOIDED", createdAt: { gte: from, lte: to } },
      include: { cashier: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  return {
    refunds,
    voided,
    refundTotal: refunds.reduce((sum, item) => sum + Number(item.totalAmt), 0),
    voidTotal: voided.reduce((sum, item) => sum + Number(item.totalAmt), 0),
  };
}

export async function getCashierPerformance(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: { cashier: { select: { id: true, displayName: true } }, items: true },
  });

  const map = new Map<number, { cashierId: number; cashier: string; orders: number; revenue: number; cost: number; voids: number }>();
  for (const order of orders) {
    const row = map.get(order.cashier.id) ?? {
      cashierId: order.cashier.id,
      cashier: order.cashier.displayName,
      orders: 0,
      revenue: 0,
      cost: 0,
      voids: 0,
    };
    if (order.status === "VOIDED") row.voids += 1;
    else {
      // Refunded units are netted out the same way `orderCost` does — a
      // partially-returned bill must not keep counting the returned lines as
      // this cashier's revenue/cost.
      const { netRevenue, cost } = orderCost(order);
      row.orders += 1;
      row.revenue += netRevenue;
      row.cost += cost;
    }
    map.set(order.cashier.id, row);
  }

  return [...map.values()]
    .map((row) => ({ ...row, profit: row.revenue - row.cost }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getLowStockReorder() {
  const rows = await prisma.stock.findMany({
    where: { product: { isActive: true } },
    include: {
      product: {
        select: {
          id: true,
          barcode: true,
          name: true,
          unit: true,
          lowStockAt: true,
          reorderPoint: true,
          reorderQty: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  return rows
    .filter((row) => row.quantity <= row.product.reorderPoint)
    .map((row) => ({
      productId: row.product.id,
      barcode: row.product.barcode,
      name: row.product.name,
      unit: row.product.unit,
      category: row.product.category.name,
      quantity: row.quantity,
      lowStockAt: row.product.lowStockAt,
      reorderPoint: row.product.reorderPoint,
      reorderQty: row.product.reorderQty,
    }))
    .sort((a, b) => a.quantity - b.quantity);
}

export async function getExpiryLoss(asOf = new Date()) {
  const rows = await prisma.stock.findMany({
    where: { product: { isActive: true, expiryDate: { lte: asOf } } },
    include: {
      product: {
        select: {
          id: true,
          barcode: true,
          name: true,
          unit: true,
          costPrice: true,
          sellPrice: true,
          expiryDate: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    productId: row.product.id,
    barcode: row.product.barcode,
    name: row.product.name,
    unit: row.product.unit,
    category: row.product.category.name,
    expiryDate: row.product.expiryDate,
    quantity: row.quantity,
    costLoss: Number(row.product.costPrice) * row.quantity,
    retailLoss: Number(row.product.sellPrice) * row.quantity,
  }));
}

export async function getProfitByCategory(from: Date, to: Date) {
  const items = await prisma.orderItem.findMany({
    where: { order: { ...SOLD, createdAt: { gte: from, lte: to } } },
    include: { product: { select: { category: { select: { id: true, name: true } } } } },
  });

  const map = new Map<number, { categoryId: number; category: string; revenue: number; cost: number; qty: number }>();
  for (const item of items) {
    const category = item.product.category;
    const row = map.get(category.id) ?? { categoryId: category.id, category: category.name, revenue: 0, cost: 0, qty: 0 };
    // Refunded units come back off both the revenue and cost side, same as `orderCost`.
    const soldQty = item.quantity - item.refundedQty;
    row.revenue += Number(item.unitPrice) * soldQty;
    row.cost += Number(item.costPrice) * soldQty;
    row.qty += soldQty;
    map.set(category.id, row);
  }

  return [...map.values()]
    .map((row) => ({ ...row, profit: row.revenue - row.cost, margin: marginPct(row.revenue, row.revenue - row.cost) }))
    .sort((a, b) => b.profit - a.profit);
}

export async function getPaymentBreakdown(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { ...SOLD, createdAt: { gte: from, lte: to } },
    select: { paymentMethod: true, totalAmt: true },
  });
  const map = new Map<string, { paymentMethod: string; orders: number; revenue: number }>();
  for (const order of orders) {
    const row = map.get(order.paymentMethod) ?? { paymentMethod: order.paymentMethod, orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += Number(order.totalAmt);
    map.set(order.paymentMethod, row);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}
