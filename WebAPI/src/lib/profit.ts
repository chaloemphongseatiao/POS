import { Prisma } from "@prisma/client";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Profit as a share of the selling price. Undefined without a sale to divide by. */
export function marginPct(revenue: number, profit: number): number {
  return revenue > 0 ? round2((profit / revenue) * 100) : 0;
}

/**
 * Profit as a share of what the goods cost — the mark-up the shop puts on top.
 * A free item (cost 0) has no meaningful mark-up, so it reports 0 rather than
 * an infinity that would poison every average built on it.
 */
export function markupPct(cost: number, profit: number): number {
  return cost > 0 ? round2((profit / cost) * 100) : 0;
}

type CostedItem = {
  quantity: number;
  refundedQty: number;
  unitPrice: Prisma.Decimal;
  costPrice: Prisma.Decimal | null;
};

type CostedOrder = {
  status: string;
  subtotal: Prisma.Decimal;
  totalAmt: Prisma.Decimal;
  items: CostedItem[];
};

export type OrderCost = {
  /** What the bill actually brought in, after refunded lines are taken back out. */
  netRevenue: number;
  cost: number;
  profit: number;
  margin: number;
  markup: number;
};

/**
 * Cost and profit for a single bill, counted the same way the reports do:
 * refunded lines are stripped from both sides, and a voided bill is worth
 * nothing at all. Refunded revenue is scaled by the bill's discount ratio so
 * a discounted sale never gives back more than the customer paid — the same
 * rule the refund service applies when it writes the refund record.
 */
export function orderCost(order: CostedOrder): OrderCost {
  if (order.status === "VOIDED") {
    return { netRevenue: 0, cost: 0, profit: 0, margin: 0, markup: 0 };
  }

  const subtotal = Number(order.subtotal);
  const paidRatio = subtotal > 0 ? Number(order.totalAmt) / subtotal : 1;

  let refundedRevenue = 0;
  let cost = 0;
  for (const item of order.items) {
    const soldQty = item.quantity - item.refundedQty;
    cost += Number(item.costPrice ?? 0) * soldQty;
    refundedRevenue += Number(item.unitPrice) * item.refundedQty * paidRatio;
  }

  const netRevenue = round2(Number(order.totalAmt) - refundedRevenue);
  const roundedCost = round2(cost);
  const profit = round2(netRevenue - roundedCost);

  return {
    netRevenue,
    cost: roundedCost,
    profit,
    margin: marginPct(netRevenue, profit),
    markup: markupPct(roundedCost, profit),
  };
}
