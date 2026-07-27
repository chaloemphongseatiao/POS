import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── ยาสูบ ─────────────────────────────────────────────────────────────────────

const tobacco = [
  // บุหรี่ซิกาแรต — แบรนด์ไทย
  { barcode: "8850001100011", name: "กรองทิพย์ (เขียว) 1 ซอง", costPrice: 85, sellPrice: 98, unit: "ซอง", lowStockAt: 20, stock: 100, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850001100028", name: "กรองทิพย์ (แดง) 1 ซอง", costPrice: 85, sellPrice: 98, unit: "ซอง", lowStockAt: 20, stock: 100, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850001100035", name: "กรองทิพย์ (ฟ้า) Light 1 ซอง", costPrice: 85, sellPrice: 98, unit: "ซอง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850001200011", name: "แสงโสม 1 ซอง", costPrice: 70, sellPrice: 82, unit: "ซอง", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850001200028", name: "แสงโสม 90 1 ซอง", costPrice: 75, sellPrice: 88, unit: "ซอง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850001300011", name: "สามเอ 1 ซอง", costPrice: 65, sellPrice: 75, unit: "ซอง", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850001300028", name: "ฟ้าเหลือง 1 ซอง", costPrice: 58, sellPrice: 68, unit: "ซอง", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850001400011", name: "เวสต์ (แดง) 1 ซอง", costPrice: 82, sellPrice: 95, unit: "ซอง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850001400028", name: "เวสต์ (น้ำเงิน) Light 1 ซอง", costPrice: 82, sellPrice: 95, unit: "ซอง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },

  // บุหรี่ซิกาแรต — แบรนด์สากล
  { barcode: "8850002100011", name: "มาร์ลโบโร แดง 1 ซอง", costPrice: 105, sellPrice: 120, unit: "ซอง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002100028", name: "มาร์ลโบโร โกลด์ 1 ซอง", costPrice: 105, sellPrice: 120, unit: "ซอง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002100035", name: "มาร์ลโบโร ไอซ์ บลาสต์ 1 ซอง", costPrice: 108, sellPrice: 125, unit: "ซอง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002200011", name: "คาเมล (แดง) 1 ซอง", costPrice: 100, sellPrice: 115, unit: "ซอง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002200028", name: "คาเมล ไลท์ 1 ซอง", costPrice: 100, sellPrice: 115, unit: "ซอง", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002300011", name: "แอล แอนด์ เอ็ม (แดง) 1 ซอง", costPrice: 90, sellPrice: 105, unit: "ซอง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002300028", name: "แอล แอนด์ เอ็ม สีฟ้า 1 ซอง", costPrice: 90, sellPrice: 105, unit: "ซอง", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002400011", name: "ปาร์ลิอาเมนต์ 1 ซอง", costPrice: 108, sellPrice: 125, unit: "ซอง", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002500011", name: "วินสตัน (แดง) 1 ซอง", costPrice: 95, sellPrice: 110, unit: "ซอง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850002500028", name: "วินสตัน สีน้ำเงิน 1 ซอง", costPrice: 95, sellPrice: 110, unit: "ซอง", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },

  // บุหรี่ไฟฟ้า / พอด (ขายอุปกรณ์เสริม — ถ้าถูกกฎหมาย)
  // หมายเหตุ: บุหรี่ไฟฟ้าผิดกฎหมายในไทย ดังนั้นไม่รวมในระบบ

  // ยาสูบอื่น ๆ
  { barcode: "8850003100011", name: "ยาเส้นรถไฟ 50g", costPrice: 20, sellPrice: 30, unit: "ซอง", lowStockAt: 10, stock: 40, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850003100028", name: "ยาเส้นสยาม 50g", costPrice: 22, sellPrice: 32, unit: "ซอง", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850003200011", name: "ยาสูบมวนเอง ซองกรอง 100 ชิ้น", costPrice: 15, sellPrice: 25, unit: "ซอง", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },

  // ไฟแช็ค / อุปกรณ์เสริม
  { barcode: "8850004100011", name: "ไฟแช็คบิค (คละสี)", costPrice: 8, sellPrice: 15, unit: "อัน", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop" },
  { barcode: "8850004100028", name: "ไฟแช็คคลิปเปอร์ (คละสี)", costPrice: 15, sellPrice: 25, unit: "อัน", lowStockAt: 15, stock: 40, imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop" },
  { barcode: "8850004200011", name: "ไม้ขีดไฟ (กล่อง)", costPrice: 3, sellPrice: 6, unit: "กล่อง", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop" },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

async function upsertProducts(
  products: typeof tobacco,
  categoryId: number,
  label: string
) {
  let created = 0;
  let updated = 0;

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { barcode: p.barcode } });

    if (existing) {
      await prisma.product.update({
        where: { barcode: p.barcode },
        data: {
          name: p.name,
          costPrice: p.costPrice,
          sellPrice: p.sellPrice,
          unit: p.unit,
          lowStockAt: p.lowStockAt,
          imageUrl: p.imageUrl,
          categoryId,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          barcode: p.barcode,
          name: p.name,
          costPrice: p.costPrice,
          sellPrice: p.sellPrice,
          unit: p.unit,
          lowStockAt: p.lowStockAt,
          imageUrl: p.imageUrl,
          isActive: true,
          categoryId,
          stock: { create: { quantity: p.stock } },
        },
      });
      created++;
    }
  }

  console.log(`📦 ${label}: เพิ่มใหม่ ${created} รายการ, อัปเดต ${updated} รายการ`);
  return { created, updated };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚬 กำลังนำเข้าข้อมูลยาสูบ...\n");

  const category = await prisma.category.upsert({
    where: { name: "ยาสูบ" },
    update: {},
    create: { name: "ยาสูบ" },
  });

  const { created, updated } = await upsertProducts(tobacco, category.id, "ยาสูบ");

  console.log(`\n✅ เสร็จสิ้น! รวมสินค้าทั้งหมด ${created + updated} รายการ`);
  console.log(`   🚬 บุหรี่ไทย:    9 รายการ`);
  console.log(`   🚬 บุหรี่สากล:  10 รายการ`);
  console.log(`   🍂 ยาสูบ/มวน:   3 รายการ`);
  console.log(`   🔥 ไฟแช็ค/ไม้ขีด: 3 รายการ`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
