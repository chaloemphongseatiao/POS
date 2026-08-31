import { prisma } from "../../lib/prisma";

export async function getSettings() {
  const settings = await prisma.setting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

// Everything a receipt prints, which anyone at a till has to be able to read —
// the VAT setup included, since the receipt must show the tax the customer paid.
// Deliberately excludes the LINE credentials the admin-only endpoint returns.
const PUBLIC_SETTING_KEYS = [
  "store_name",
  "store_logo",
  "store_address",
  "tax_id",
  "vat_enabled",
  "vat_rate",
];

export async function getPublicSettings() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: PUBLIC_SETTING_KEYS } },
  });
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function upsertSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// Every table, dumped as plain JSON — Decimal/DateTime fields serialize to
// string/ISO automatically via their own toJSON(), so this round-trips through
// JSON.stringify without extra mapping.
export async function createBackup() {
  const [
    users,
    categories,
    products,
    stocks,
    stockMovements,
    orders,
    orderItems,
    refunds,
    refundItems,
    shifts,
    promotions,
    productPromotions,
    ledgerCategories,
    ledgerEntries,
    recurringEntries,
    settings,
    lineFollowers,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.stock.findMany(),
    prisma.stockMovement.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.refund.findMany(),
    prisma.refundItem.findMany(),
    prisma.shift.findMany(),
    prisma.promotion.findMany(),
    prisma.productPromotion.findMany(),
    prisma.ledgerCategory.findMany(),
    prisma.ledgerEntry.findMany(),
    prisma.recurringEntry.findMany(),
    prisma.setting.findMany(),
    prisma.lineFollower.findMany(),
  ]);

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    data: {
      users,
      categories,
      products,
      stocks,
      stockMovements,
      orders,
      orderItems,
      refunds,
      refundItems,
      shifts,
      promotions,
      productPromotions,
      ledgerCategories,
      ledgerEntries,
      recurringEntries,
      settings,
      lineFollowers,
    },
  };
}
