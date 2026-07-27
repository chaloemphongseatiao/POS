import { prisma } from "../../lib/prisma";

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
  let from: Date;
  let to: Date;

  if (fromDate && toDate) {
    from = fromDate;
    to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);
  } else {
    const [year, mon] = month.split("-").map(Number);
    from = new Date(year, mon - 1, 1);
    to = new Date(year, mon, 0, 23, 59, 59);
  }

  const orders = await prisma.order.findMany({
    where: { status: "COMPLETED", createdAt: { gte: from, lte: to } },
    include: { items: true },
  });

  const map: Record<string, { date: string; revenue: number; cost: number; orders: number }> = {};

  for (const order of orders) {
    const dateStr = order.createdAt.toISOString().slice(0, 10);
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
  const day = new Date(date);
  const nextDay = new Date(day.getTime() + 86400000);

  const orders = await prisma.order.findMany({
    where: { status: "COMPLETED", createdAt: { gte: day, lt: nextDay } },
  });

  const hours: Record<number, { hour: number; revenue: number; orders: number }> = {};
  for (let h = 0; h < 24; h++) {
    hours[h] = { hour: h, revenue: 0, orders: 0 };
  }

  for (const order of orders) {
    const h = order.createdAt.getHours();
    hours[h].revenue += Number(order.totalAmt);
    hours[h].orders += 1;
  }

  return Object.values(hours);
}
