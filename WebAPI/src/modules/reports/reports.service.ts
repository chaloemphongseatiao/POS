import { prisma } from "../../lib/prisma";
import { bangkokDateKey, bangkokDayEnd, bangkokDayStart, bangkokHour, bangkokMonthRange } from "../../lib/datetime";

export async function getSummary(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { status: "COMPLETED", createdAt: { gte: from, lte: to } },
    include: { items: true },
  });

  let revenue = 0;
  let cost = 0;
  for (const order of orders) {
    revenue += Number(order.totalAmt);
    for (const item of order.items) {
      cost += Number(item.costPrice ?? 0) * item.quantity;
    }
  }

  return {
    revenue,
    cost,
    profit: revenue - cost,
    margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
    orderCount: orders.length,
    from,
    to,
  };
}

export async function getDailyBreakdown(month: string, fromDate?: Date, toDate?: Date) {
  const range =
    fromDate && toDate ? { from: fromDate, to: toDate } : bangkokMonthRange(month);

  const orders = await prisma.order.findMany({
    where: { status: "COMPLETED", createdAt: { gte: range.from, lte: range.to } },
    include: { items: true },
  });

  const map: Record<string, { date: string; revenue: number; cost: number; orders: number }> = {};

  for (const order of orders) {
    // Bucketed by Bangkok calendar day, not the server's UTC day.
    const dateStr = bangkokDateKey(order.createdAt);
    if (!map[dateStr]) {
      map[dateStr] = { date: dateStr, revenue: 0, cost: 0, orders: 0 };
    }
    map[dateStr].revenue += Number(order.totalAmt);
    map[dateStr].orders += 1;
    for (const item of order.items) {
      map[dateStr].cost += Number(item.costPrice) * item.quantity;
    }
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTopProducts(from: Date, to: Date, limit = 10) {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: "COMPLETED", createdAt: { gte: from, lte: to } } },
    include: { product: { select: { id: true, name: true, unit: true } } },
  });

  const map: Record<
    number,
    { productId: number; name: string; unit: string; qty: number; revenue: number; profit: number }
  > = {};

  for (const item of items) {
    if (!map[item.productId]) {
      map[item.productId] = {
        productId: item.productId,
        name: item.product.name,
        unit: item.product.unit,
        qty: 0,
        revenue: 0,
        profit: 0,
      };
    }
    map[item.productId].qty += item.quantity;
    map[item.productId].revenue += Number(item.subtotal);
    map[item.productId].profit +=
      (Number(item.unitPrice) - Number(item.costPrice ?? 0)) * item.quantity;
  }

  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getHourly(date: string) {
  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: bangkokDayStart(date), lt: bangkokDayEnd(date) },
    },
  });

  const hours: Record<number, { hour: number; revenue: number; orders: number }> = {};
  for (let h = 0; h < 24; h++) {
    hours[h] = { hour: h, revenue: 0, orders: 0 };
  }

  for (const order of orders) {
    const h = bangkokHour(order.createdAt);
    hours[h].revenue += Number(order.totalAmt);
    hours[h].orders += 1;
  }

  return Object.values(hours);
}
