import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── นมสด ─────────────────────────────────────────────────────────────────────
const freshMilk = [
  { barcode: "8850201100011", name: "นมสดเมจิ รสจืด 200ml", costPrice: 16, sellPrice: 25, unit: "กล่อง", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850201100028", name: "นมสดเมจิ รสหวาน 200ml", costPrice: 16, sellPrice: 25, unit: "กล่อง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850201100035", name: "นมสดเมจิ รสช็อกโกแลต 200ml", costPrice: 16, sellPrice: 25, unit: "กล่อง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850201100042", name: "นมสดเมจิ รสสตรอเบอรี่ 200ml", costPrice: 16, sellPrice: 25, unit: "กล่อง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850201200011", name: "นมสดเมจิ รสจืด 1L", costPrice: 60, sellPrice: 82, unit: "กล่อง", lowStockAt: 10, stock: 24, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850202100011", name: "นมสดดัชมิลล์ รสจืด 200ml", costPrice: 15, sellPrice: 22, unit: "กล่อง", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850202100028", name: "นมสดดัชมิลล์ รสหวาน 200ml", costPrice: 15, sellPrice: 22, unit: "กล่อง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850202100035", name: "นมสดดัชมิลล์ รสช็อกโกแลต 200ml", costPrice: 15, sellPrice: 22, unit: "กล่อง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850202200011", name: "นมสดดัชมิลล์ รสจืด 1L", costPrice: 55, sellPrice: 75, unit: "กล่อง", lowStockAt: 10, stock: 24, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850203100011", name: "นมสดโฟร์โมสต์ รสจืด 250ml", costPrice: 16, sellPrice: 25, unit: "กล่อง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850203100028", name: "นมสดโฟร์โมสต์ รสหวาน 250ml", costPrice: 16, sellPrice: 25, unit: "กล่อง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850204100011", name: "โยเกิร์ตดัชมิลล์ รสสตรอเบอรี่ 135g", costPrice: 18, sellPrice: 28, unit: "ถ้วย", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850204100028", name: "โยเกิร์ตดัชมิลล์ รสบลูเบอรี่ 135g", costPrice: 18, sellPrice: 28, unit: "ถ้วย", lowStockAt: 15, stock: 36, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850204200011", name: "นมเปรี้ยวดัชมิลล์ รสสตรอเบอรี่ 180ml", costPrice: 10, sellPrice: 18, unit: "ขวด", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850204200028", name: "นมเปรี้ยวดัชมิลล์ รสองุ่น 180ml", costPrice: 10, sellPrice: 18, unit: "ขวด", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
];

// ─── ชาเขียว ──────────────────────────────────────────────────────────────────
const greenTea = [
  { barcode: "8850205100011", name: "ชาเขียวโออิชิ รสดั้งเดิม 350ml", costPrice: 16, sellPrice: 25, unit: "ขวด", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205100028", name: "ชาเขียวโออิชิ รสน้ำผึ้งมะนาว 350ml", costPrice: 16, sellPrice: 25, unit: "ขวด", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205100035", name: "ชาเขียวโออิชิ รสองุ่น 350ml", costPrice: 16, sellPrice: 25, unit: "ขวด", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205200011", name: "ชาเขียวโออิชิ รสดั้งเดิม 1L", costPrice: 32, sellPrice: 48, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205300011", name: "ชาเขียวอิชิตัน รสดั้งเดิม 350ml", costPrice: 15, sellPrice: 22, unit: "ขวด", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205300028", name: "ชาเขียวอิชิตัน รสน้ำผึ้งมะนาว 350ml", costPrice: 15, sellPrice: 22, unit: "ขวด", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205300035", name: "ชาเขียวอิชิตัน รสสตรอเบอรี่ 350ml", costPrice: 15, sellPrice: 22, unit: "ขวด", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205400011", name: "ชาดำเย็นลิปตัน รสดั้งเดิม 350ml", costPrice: 15, sellPrice: 22, unit: "ขวด", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205400028", name: "ชาดำเย็นลิปตัน รสพีช 350ml", costPrice: 15, sellPrice: 22, unit: "ขวด", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205500011", name: "ชามะนาวช้างโกลด์ 350ml", costPrice: 14, sellPrice: 22, unit: "ขวด", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205500028", name: "ชามะนาวช้างโกลด์ 1L", costPrice: 28, sellPrice: 42, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205600011", name: "ชาไทยตรานมตรา 250ml", costPrice: 14, sellPrice: 22, unit: "กล่อง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850205700011", name: "ชาเขียวมัทฉะ พร้อมดื่ม 300ml", costPrice: 22, sellPrice: 35, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
];

// ─── น้ำแข็ง ──────────────────────────────────────────────────────────────────
const ice = [
  { barcode: "8850206100011", name: "น้ำแข็งหลอด 1kg", costPrice: 8, sellPrice: 15, unit: "ถุง", lowStockAt: 20, stock: 100, imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop" },
  { barcode: "8850206100028", name: "น้ำแข็งหลอด 2kg", costPrice: 15, sellPrice: 25, unit: "ถุง", lowStockAt: 15, stock: 80, imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop" },
  { barcode: "8850206200011", name: "น้ำแข็งก้อน 1kg", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop" },
  { barcode: "8850206200028", name: "น้ำแข็งก้อน 2.5kg", costPrice: 22, sellPrice: 35, unit: "ถุง", lowStockAt: 10, stock: 40, imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop" },
  { barcode: "8850206300011", name: "น้ำแข็งบด 1kg", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop" },
];

// ─── เครื่องดื่มสด / ชง ───────────────────────────────────────────────────────
const freshDrinks = [
  { barcode: "8850207100011", name: "น้ำมะพร้าวสด 500ml", costPrice: 22, sellPrice: 35, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1550461716-dbf266b2a8a7?w=400&h=400&fit=crop" },
  { barcode: "8850207100028", name: "น้ำมะพร้าวสด 1L", costPrice: 40, sellPrice: 60, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1550461716-dbf266b2a8a7?w=400&h=400&fit=crop" },
  { barcode: "8850207200011", name: "น้ำส้มคั้นสด 350ml", costPrice: 20, sellPrice: 32, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop" },
  { barcode: "8850207300011", name: "น้ำอ้อยสด 350ml", costPrice: 12, sellPrice: 20, unit: "แก้ว", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop" },
  { barcode: "8850207400011", name: "กาแฟเย็น 350ml", costPrice: 18, sellPrice: 30, unit: "แก้ว", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },
  { barcode: "8850207400028", name: "กาแฟลาเต้เย็น 350ml", costPrice: 20, sellPrice: 35, unit: "แก้ว", lowStockAt: 10, stock: 24, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },
  { barcode: "8850207500011", name: "ชาไทยเย็น 350ml", costPrice: 15, sellPrice: 25, unit: "แก้ว", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850207500028", name: "ชามะนาวเย็น 350ml", costPrice: 12, sellPrice: 20, unit: "แก้ว", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

async function upsertProducts(products: { barcode: string; name: string; costPrice: number; sellPrice: number; unit: string; lowStockAt: number; stock: number; imageUrl: string }[], categoryId: number, label: string) {
  let created = 0;
  let updated = 0;

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { barcode: p.barcode } });

    if (existing) {
      await prisma.product.update({
        where: { barcode: p.barcode },
        data: { name: p.name, costPrice: p.costPrice, sellPrice: p.sellPrice, unit: p.unit, lowStockAt: p.lowStockAt, imageUrl: p.imageUrl, categoryId },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          barcode: p.barcode, name: p.name, costPrice: p.costPrice, sellPrice: p.sellPrice,
          unit: p.unit, lowStockAt: p.lowStockAt, imageUrl: p.imageUrl, isActive: true,
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
  console.log("🥛 กำลังนำเข้าข้อมูลเครื่องดื่ม (นม/ชาเขียว/น้ำแข็ง)...\n");

  const drinkCategory = await prisma.category.upsert({
    where: { name: "เครื่องดื่ม" },
    update: {},
    create: { name: "เครื่องดื่ม" },
  });

  const r1 = await upsertProducts(freshMilk, drinkCategory.id, "นมสด/โยเกิร์ต");
  const r2 = await upsertProducts(greenTea, drinkCategory.id, "ชาเขียว/ชาพร้อมดื่ม");
  const r3 = await upsertProducts(ice, drinkCategory.id, "น้ำแข็ง");
  const r4 = await upsertProducts(freshDrinks, drinkCategory.id, "เครื่องดื่มสด/ชง");

  const total = r1.created + r2.created + r3.created + r4.created + r1.updated + r2.updated + r3.updated + r4.updated;
  console.log(`\n✅ เสร็จสิ้น! รวมสินค้าใหม่ทั้งหมด ${total} รายการ`);
  console.log(`   🥛 นมสด/โยเกิร์ต:           ${r1.created + r1.updated} รายการ`);
  console.log(`   🍵 ชาเขียว/ชาพร้อมดื่ม:     ${r2.created + r2.updated} รายการ`);
  console.log(`   🧊 น้ำแข็ง:                  ${r3.created + r3.updated} รายการ`);
  console.log(`   🥤 เครื่องดื่มสด/ชง:         ${r4.created + r4.updated} รายการ`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
