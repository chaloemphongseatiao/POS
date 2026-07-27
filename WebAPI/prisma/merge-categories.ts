import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function mergeCategory(keepId: number, mergeId: number, keepName: string) {
  const keep = await prisma.category.findUnique({ where: { id: keepId } });
  const merge = await prisma.category.findUnique({
    where: { id: mergeId },
    include: { _count: { select: { products: true } } },
  });

  if (!keep || !merge) {
    console.log(`❌ ไม่พบหมวดหมู่ id=${keepId} หรือ id=${mergeId}`);
    return;
  }

  console.log(`🔀 รวม "${merge.name}" (${merge._count.products} สินค้า) → "${keep.name}"`);

  await prisma.product.updateMany({
    where: { categoryId: mergeId },
    data: { categoryId: keepId },
  });

  await prisma.category.delete({ where: { id: mergeId } });

  if (keep.name !== keepName) {
    await prisma.category.update({ where: { id: keepId }, data: { name: keepName } });
  }

  console.log(`✅ เสร็จแล้ว — หมวด "${keepName}" รวมสินค้าแล้ว`);
}

async function main() {
  // ขนม/อาหาร (id=2) → รวมเข้า ขนม (id=5)
  await mergeCategory(5, 2, "ขนม");

  // น้ำดื่ม (id=8) → รวมเข้า เครื่องดื่ม (id=1)
  await mergeCategory(1, 8, "เครื่องดื่ม");

  // สรุป
  const cats = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  console.log("\n📋 หมวดหมู่ทั้งหมดหลังรวม:");
  cats.forEach((c) => console.log(`   ${c.id} | ${c.name} | ${c._count.products} สินค้า`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
