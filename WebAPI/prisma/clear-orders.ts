import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const [movements, items, orders] = await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { type: "SALE" } }),
    prisma.orderItem.deleteMany({}),
    prisma.order.deleteMany({}),
  ]);

  console.log(`ลบ StockMovement (SALE): ${movements.count} รายการ`);
  console.log(`ลบ OrderItem: ${items.count} รายการ`);
  console.log(`ลบ Order: ${orders.count} รายการ`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
