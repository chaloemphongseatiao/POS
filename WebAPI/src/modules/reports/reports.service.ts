import { prisma } from "../../lib/prisma";
import { bangkokDateKey, bangkokDayEnd, bangkokDayStart, bangkokHour, bangkokMonthRange } from "../../lib/datetime";

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

  return {
    revenue,
    cost,
    profit: revenue - cost,
    margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
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
    { productId: number; name: string; unit: string; qty: number; revenue: number; profit: number }
  > = {};

  const bucket = (product: { id: number; name: string; unit: string }) => {
    if (!map[product.id]) {
      map[product.id] = {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        qty: 0,
        revenue: 0,
        profit: 0,
      };
    }
    return map[product.id];
  };

  for (const item of items) {
    const row = bucket(item.product);
    row.qty += item.quantity;
    row.revenue += Number(item.subtotal);
    row.profit += (Number(item.unitPrice) - Number(item.costPrice ?? 0)) * item.quantity;
  }

  // Returned units are not sales: they come off the quantity and the money.
  for (const item of refundItems) {
    const row = bucket(item.product);
    row.qty -= item.quantity;
    row.revenue -= Number(item.subtotal);
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
