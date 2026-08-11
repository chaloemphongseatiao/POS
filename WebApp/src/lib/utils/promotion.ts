import { CartItem, Promotion } from "@/lib/types";

/**
 * Mirrors `promotionDiscount()` in `WebAPI/src/modules/orders/orders.service.ts`
 * so the cart total the cashier sees (and quotes for QR PromptPay) matches what
 * `createOrder` actually charges. A product under more than one active
 * promotion has its discounts summed first and only then capped against that
 * product's own subtotal — capping each promotion separately would let two
 * overlapping promotions discount the same line by more than 100% of its value.
 */
export function computePromotionDiscount(items: CartItem[], promotions: Promotion[], now = new Date()): number {
  const demandByProduct = new Map<number, number>();
  for (const item of items) {
    demandByProduct.set(item.productId, (demandByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  const rawDiscountByProduct = new Map<number, number>();
  for (const promotion of promotions) {
    if (!promotion.isActive) continue;
    if (promotion.startsAt && new Date(promotion.startsAt) > now) continue;
    if (promotion.endsAt && new Date(promotion.endsAt) < now) continue;

    const value = Number(promotion.value);
    for (const { product } of promotion.products) {
      const qty = demandByProduct.get(product.id) ?? 0;
      if (qty < promotion.minQty) continue;
      const item = items.find((i) => i.productId === product.id);
      if (!item) continue;

      const lineSubtotal = item.sellPrice * qty;
      const lineDiscount =
        promotion.type === "PERCENT_OFF"
          ? (lineSubtotal * Math.min(value, 100)) / 100
          : value * Math.floor(qty / promotion.minQty);
      rawDiscountByProduct.set(product.id, (rawDiscountByProduct.get(product.id) ?? 0) + lineDiscount);
    }
  }

  let discount = 0;
  for (const [productId, rawDiscount] of rawDiscountByProduct) {
    const item = items.find((i) => i.productId === productId);
    if (!item) continue;
    const qty = demandByProduct.get(productId) ?? 0;
    const lineSubtotal = item.sellPrice * qty;
    discount += Math.min(lineSubtotal, rawDiscount);
  }
  return Math.round(discount * 100) / 100;
}
