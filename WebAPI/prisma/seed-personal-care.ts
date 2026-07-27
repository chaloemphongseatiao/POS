import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = [
  // สบู่
  { barcode: "8850501100011", name: "สบู่ลักส์ สูตรครีม 65g", costPrice: 18, sellPrice: 28, unit: "ก้อน", lowStockAt: 12, stock: 60 },
  { barcode: "8850501100028", name: "สบู่ดอฟ มอยเจอร์ไรเซอร์ 65g", costPrice: 20, sellPrice: 32, unit: "ก้อน", lowStockAt: 12, stock: 48 },
  { barcode: "8850501100035", name: "สบู่เซฟการ์ด ออริจินัล 65g", costPrice: 18, sellPrice: 28, unit: "ก้อน", lowStockAt: 12, stock: 48 },
  { barcode: "8850501200011", name: "ครีมอาบน้ำดอฟ 200ml", costPrice: 45, sellPrice: 68, unit: "ขวด", lowStockAt: 6, stock: 30 },
  { barcode: "8850501200028", name: "ครีมอาบน้ำนีเวีย 200ml", costPrice: 48, sellPrice: 75, unit: "ขวด", lowStockAt: 6, stock: 30 },
  // แชมพู
  { barcode: "8850502100011", name: "แชมพูรีจอยส์ สูตรธรรมดา 170ml", costPrice: 45, sellPrice: 68, unit: "ขวด", lowStockAt: 6, stock: 30 },
  { barcode: "8850502100028", name: "แชมพูซันซิล ดำเงางาม 170ml", costPrice: 45, sellPrice: 68, unit: "ขวด", lowStockAt: 6, stock: 30 },
  { barcode: "8850502100035", name: "แชมพูแพนทีน แอนตี้แดนดรัฟ 170ml", costPrice: 50, sellPrice: 78, unit: "ขวด", lowStockAt: 6, stock: 25 },
  { barcode: "8850502200011", name: "แชมพูซอง (ซองเดี่ยว 8ml)", costPrice: 4, sellPrice: 7, unit: "ซอง", lowStockAt: 30, stock: 120 },
  // ยาสีฟัน
  { barcode: "8850503100011", name: "ยาสีฟันคอลเกต ออริจินัล 150g", costPrice: 35, sellPrice: 55, unit: "หลอด", lowStockAt: 8, stock: 40 },
  { barcode: "8850503100028", name: "ยาสีฟันดาร์ลี่ ออริจินัล 150g", costPrice: 30, sellPrice: 48, unit: "หลอด", lowStockAt: 8, stock: 40 },
  { barcode: "8850503200011", name: "แปรงสีฟัน (อัน)", costPrice: 12, sellPrice: 22, unit: "อัน", lowStockAt: 8, stock: 30 },
  // โลชั่น/ครีม
  { barcode: "8850504100011", name: "โลชั่นนีเวีย เอ็กซ์เพิร์ต 200ml", costPrice: 65, sellPrice: 98, unit: "ขวด", lowStockAt: 6, stock: 25 },
  { barcode: "8850504100028", name: "โลชั่นวาสลีน 200ml", costPrice: 58, sellPrice: 88, unit: "ขวด", lowStockAt: 6, stock: 25 },
  // ผ้าอนามัย/ทิชชู
  { barcode: "8850505100011", name: "ผ้าอนามัยโซฟี (แผง 8 ชิ้น)", costPrice: 28, sellPrice: 45, unit: "แผง", lowStockAt: 8, stock: 40 },
  { barcode: "8850505200011", name: "ทิชชูเปียก (แผง 10 ชิ้น)", costPrice: 12, sellPrice: 20, unit: "แผง", lowStockAt: 12, stock: 60 },
  { barcode: "8850505300011", name: "ทิชชูแห้ง เล็ก (แพ็ค 3 ห่อ)", costPrice: 15, sellPrice: 25, unit: "แพ็ค", lowStockAt: 10, stock: 50 },
  // โกนหนวด
  { barcode: "8850506100011", name: "มีดโกนจิลเลตต์ (2 อัน)", costPrice: 18, sellPrice: 30, unit: "แพ็ค", lowStockAt: 6, stock: 25 },
  { barcode: "8850506200011", name: "โฟมโกนหนวดจิลเลตต์ 55ml", costPrice: 45, sellPrice: 72, unit: "กระป๋อง", lowStockAt: 4, stock: 20 },
  // ผ้าอ้อม/เด็ก
  { barcode: "8850507100011", name: "ผ้าอ้อมผู้ใหญ่ (แผง 1 ชิ้น)", costPrice: 12, sellPrice: 20, unit: "ชิ้น", lowStockAt: 6, stock: 30 },
];

async function main() {
  console.log("🧴 Seeding ของใช้ส่วนตัว...");
  const cat = await prisma.category.upsert({ where: { name: "ของใช้ส่วนตัว" }, update: {}, create: { name: "ของใช้ส่วนตัว" } });
  let created = 0, skipped = 0;
  for (const p of products) {
    const exists = await prisma.product.findUnique({ where: { barcode: p.barcode } });
    if (exists) { skipped++; continue; }
    const product = await prisma.product.create({
      data: { barcode: p.barcode, name: p.name, costPrice: p.costPrice, sellPrice: p.sellPrice, unit: p.unit, lowStockAt: p.lowStockAt, isActive: true, categoryId: cat.id, stock: { create: { quantity: p.stock } } },
    });
    await prisma.stockMovement.create({ data: { type: "STOCK_IN", quantity: p.stock, note: "นำเข้าข้อมูลเริ่มต้น", productId: product.id, userId: 1 } });
    created++;
  }
  console.log(`✅ ของใช้ส่วนตัว: สร้าง ${created} รายการ, ข้าม ${skipped} รายการ`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
