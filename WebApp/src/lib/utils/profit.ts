/**
 * Profit as a share of what the goods cost — the mark-up on top of the buying
 * price, not the margin on the selling price. Free goods report 0 rather than
 * an infinity that would poison any total built on them.
 */
export function markupOf(cost: number, profit: number): number {
  return cost > 0 ? (profit / cost) * 100 : 0;
}

/** Profit as a share of the selling price. */
export function marginOf(revenue: number, profit: number): number {
  return revenue > 0 ? (profit / revenue) * 100 : 0;
}
