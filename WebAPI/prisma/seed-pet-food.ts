import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = [
  // อาหารแมว
  { barcode: "8850701100011", name: "วิสกัส รสทูน่า 85g (กระป๋อง)", costPrice: 12, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 12, stock: 60 },
  { barcode: "8850701100028", name: "วิสกัส รสแซลมอน 85g (กระป๋อง)", costPrice: 12, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 12, stock: 60 },
  { barcode: "8850701100035", name: "วิสกัส รสไก่ 85g (กระป๋อง)", costPrice: 12, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 12, stock: 48 },
  { barcode: "8850701200011", name: "วิสกัส เม็ดแห้ง รสทูน่า 1.2kg", costPrice: 110, sellPrice: 165, unit: "ถุง", lowStockAt: 4, stock: 20 },
  { barcode: "8850701300011", name: "เชบา รสทูน่า 85g (กระป๋อง)", costPrice: 18, sellPrice: 30, unit: "กระป๋อง", lowStockAt: 8, stock: 40 },
  { barcode: "8850701300028", name: "เชบา รสไก่ 85g (กระป๋อง)", costPrice: 18, sellPrice: 30, unit: "กระป๋อง", lowStockAt: 8, stock: 40 },
  { barcode: "8850701400011", name: "มีโอว์มิกซ์ เม็ดแห้ง 1.1kg", costPrice: 95, sellPrice: 145, unit: "ถุง", lowStockAt: 4, stock: 15 },
  // อาหารสุนัข
  { barcode: "8850702100011", name: "ซีซาร์ รสเนื้อ 100g (กระป๋อง)", costPrice: 18, sellPrice: 30, unit: "กระป๋อง", lowStockAt: 8, stock: 40 },
  { barcode: "8850702100028", name: "ซีซาร์ รสไก่ 100g (กระป๋อง)", costPrice: 18, sellPrice: 30, unit: "กระป๋อง", lowStockAt: 8, stock: 40 },
  { barcode: "8850702200011", name: "สมาร์ทฮาร์ท เม็ดแห้ง รสไก่ 1.5kg", costPrice: 120, sellPrice: 180, unit: "ถุง", lowStockAt: 3, stock: 15 },
  { barcode: "8850702200028", name: "สมาร์ทฮาร์ท เม็ดแห้ง รสเนื้อ 1.5kg", costPrice: 120, sellPrice: 180, unit: "ถุง", lowStockAt: 3, stock: 15 },
  { barcode: "8850702300011", name: "เพดดิกรี เม็ดแห้ง 1.5kg", costPrice: 130, sellPrice: 198, unit: "ถุง", lowStockAt: 3, stock: 12 },
  // ทรายแมว
  { barcode: "8850703100011", name: "ทรายแมวก้อน กลิ่นลาเวนเดอร์ 5L", costPrice: 75, sellPrice: 110, unit: "ถุง", lowStockAt: 4, stock: 20 },
  { barcode: "8850703200011", name: "ทรายแมวเต้าหู้ 6L", costPrice: 90, sellPrice: 135, unit: "ถุง", lowStockAt: 3, stock: 12 },
  // อุปกรณ์เสริม
  { barcode: "8850704100011", name: "ขนมแมวแท่ง Ciao (แพ็ค 4 แท่ง)", costPrice: 15, sellPrice: 25, unit: "แพ็ค", lowStockAt: 8, stock: 40 },
  { barcode: "8850704200011", name: "ขนมสุนัข Milk-Bone (กล่อง)", costPrice: 55, sellPrice: 85, unit: "กล่อง", lowStockAt: 4, stock: 20 },
];

async function main() {
  console.log("🐾 Seeding อาหารสัตว์...");
  const cat = await prisma.category.upsert({ where: { name: "อาหารสัตว์" }, update: {}, create: { name: "อาหารสัตว์" } });
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
  console.log(`✅ อาหารสัตว์: สร้าง ${created} รายการ, ข้าม ${skipped} รายการ`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
