import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = [
  // ขนมปังแผ่น
  { barcode: "8850601100011", name: "ขนมปังแฟร์รี่ รสธรรมดา (แพ็ค)", costPrice: 20, sellPrice: 30, unit: "แพ็ค", lowStockAt: 6, stock: 30 },
  { barcode: "8850601100028", name: "ขนมปังแฟร์รี่ รสหวาน (แพ็ค)", costPrice: 20, sellPrice: 30, unit: "แพ็ค", lowStockAt: 6, stock: 30 },
  { barcode: "8850601100035", name: "ขนมปังโฮลวีทแฟร์รี่ (แพ็ค)", costPrice: 28, sellPrice: 42, unit: "แพ็ค", lowStockAt: 4, stock: 20 },
  { barcode: "8850601200011", name: "ขนมปังยิ้ม รสธรรมดา (แพ็ค)", costPrice: 18, sellPrice: 28, unit: "แพ็ค", lowStockAt: 6, stock: 25 },
  // ขนมปังไส้
  { barcode: "8850602100011", name: "ขนมปังไส้สังขยา (ชิ้น)", costPrice: 8, sellPrice: 15, unit: "ชิ้น", lowStockAt: 10, stock: 40 },
  { barcode: "8850602100028", name: "ขนมปังไส้ช็อกโกแลต (ชิ้น)", costPrice: 8, sellPrice: 15, unit: "ชิ้น", lowStockAt: 10, stock: 40 },
  { barcode: "8850602100035", name: "ขนมปังไส้ถั่วแดง (ชิ้น)", costPrice: 8, sellPrice: 15, unit: "ชิ้น", lowStockAt: 10, stock: 35 },
  { barcode: "8850602100042", name: "ขนมปังไส้ครีม (ชิ้น)", costPrice: 9, sellPrice: 18, unit: "ชิ้น", lowStockAt: 10, stock: 35 },
  // โดนัท
  { barcode: "8850603100011", name: "โดนัทเคลือบช็อกโกแลต (ชิ้น)", costPrice: 10, sellPrice: 18, unit: "ชิ้น", lowStockAt: 6, stock: 30 },
  { barcode: "8850603100028", name: "โดนัทเคลือบน้ำตาล (ชิ้น)", costPrice: 10, sellPrice: 18, unit: "ชิ้น", lowStockAt: 6, stock: 30 },
  // เค้ก/พาย
  { barcode: "8850604100011", name: "คัพเค้กช็อกโกแลต (ชิ้น)", costPrice: 15, sellPrice: 25, unit: "ชิ้น", lowStockAt: 6, stock: 24 },
  { barcode: "8850604200011", name: "พายสับปะรด (ชิ้น)", costPrice: 12, sellPrice: 20, unit: "ชิ้น", lowStockAt: 6, stock: 24 },
  { barcode: "8850604300011", name: "บราวนี่ช็อกโกแลต (ชิ้น)", costPrice: 18, sellPrice: 30, unit: "ชิ้น", lowStockAt: 6, stock: 20 },
  // ซาลาเปา
  { barcode: "8850605100011", name: "ซาลาเปาไส้หมู (ชิ้น)", costPrice: 8, sellPrice: 15, unit: "ชิ้น", lowStockAt: 10, stock: 40 },
  { barcode: "8850605100028", name: "ซาลาเปาไส้ถั่ว (ชิ้น)", costPrice: 8, sellPrice: 15, unit: "ชิ้น", lowStockAt: 10, stock: 35 },
  // คุกกี้/บิสกิต
  { barcode: "8850606100011", name: "คุกกี้เนยสด (กล่อง)", costPrice: 35, sellPrice: 55, unit: "กล่อง", lowStockAt: 6, stock: 25 },
  { barcode: "8850606200011", name: "บิสกิตมาเรียแม็คเฟิร์น (แพ็ค)", costPrice: 15, sellPrice: 25, unit: "แพ็ค", lowStockAt: 8, stock: 35 },
  { barcode: "8850606300011", name: "คุกกี้ช็อกชิพ (ห่อ)", costPrice: 20, sellPrice: 32, unit: "ห่อ", lowStockAt: 6, stock: 25 },
];

async function main() {
  console.log("🍞 Seeding ขนมปัง/เบเกอรี่...");
  const cat = await prisma.category.upsert({ where: { name: "ขนมปัง/เบเกอรี่" }, update: {}, create: { name: "ขนมปัง/เบเกอรี่" } });
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
  console.log(`✅ ขนมปัง/เบเกอรี่: สร้าง ${created} รายการ, ข้าม ${skipped} รายการ`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
