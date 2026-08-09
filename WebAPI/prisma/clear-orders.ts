import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Order matters: refunds point at order items, and both `SALE` and `RETURN`
  // movements point at orders, so the children go first.
  const [refundItems, refunds, movements, items, orders] = await prisma.$transaction([
    prisma.refundItem.deleteMany({}),
    prisma.refund.deleteMany({}),
    prisma.stockMovement.deleteMany({ where: { type: { in: ["SALE", "RETURN"] } } }),
    prisma.orderItem.deleteMany({}),
    prisma.order.deleteMany({}),
  ]);

  console.log(`ลบ RefundItem: ${refundItems.count} รายการ`);
  console.log(`ลบ Refund: ${refunds.count} รายการ`);
  console.log(`ลบ StockMovement (SALE/RETURN): ${movements.count} รายการ`);
  console.log(`ลบ OrderItem: ${items.count} รายการ`);
  console.log(`ลบ Order: ${orders.count} รายการ`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
