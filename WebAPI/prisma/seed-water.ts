import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── น้ำดื่มบรรจุขวด ──────────────────────────────────────────────────────────
const bottledWater = [
  { barcode: "8850301100011", name: "น้ำดื่มสิงห์ 350ml", costPrice: 5, sellPrice: 8, unit: "ขวด", lowStockAt: 24, stock: 144 },
  { barcode: "8850301100028", name: "น้ำดื่มสิงห์ 600ml", costPrice: 6, sellPrice: 10, unit: "ขวด", lowStockAt: 24, stock: 120 },
  { barcode: "8850301100035", name: "น้ำดื่มสิงห์ 1.5L", costPrice: 10, sellPrice: 15, unit: "ขวด", lowStockAt: 12, stock: 60 },
  { barcode: "8850301200011", name: "น้ำดื่มสิงห์ แพ็ค 6 (600ml)", costPrice: 32, sellPrice: 55, unit: "แพ็ค", lowStockAt: 6, stock: 30 },
  { barcode: "8850302100011", name: "น้ำดื่มช้าง 350ml", costPrice: 5, sellPrice: 8, unit: "ขวด", lowStockAt: 24, stock: 144 },
  { barcode: "8850302100028", name: "น้ำดื่มช้าง 600ml", costPrice: 6, sellPrice: 10, unit: "ขวด", lowStockAt: 24, stock: 120 },
  { barcode: "8850302100035", name: "น้ำดื่มช้าง 1.5L", costPrice: 10, sellPrice: 15, unit: "ขวด", lowStockAt: 12, stock: 60 },
  { barcode: "8850302200011", name: "น้ำดื่มช้าง แพ็ค 6 (600ml)", costPrice: 32, sellPrice: 55, unit: "แพ็ค", lowStockAt: 6, stock: 30 },
  { barcode: "8850303100011", name: "น้ำดื่มคริสตัล 350ml", costPrice: 4, sellPrice: 7, unit: "ขวด", lowStockAt: 24, stock: 120 },
  { barcode: "8850303100028", name: "น้ำดื่มคริสตัล 600ml", costPrice: 5, sellPrice: 8, unit: "ขวด", lowStockAt: 24, stock: 96 },
  { barcode: "8850303100035", name: "น้ำดื่มคริสตัล 1.5L", costPrice: 8, sellPrice: 13, unit: "ขวด", lowStockAt: 12, stock: 48 },
  { barcode: "8850304100011", name: "น้ำดื่มมิเนเร่ 330ml", costPrice: 8, sellPrice: 15, unit: "ขวด", lowStockAt: 12, stock: 72 },
  { barcode: "8850304100028", name: "น้ำดื่มมิเนเร่ 750ml", costPrice: 15, sellPrice: 25, unit: "ขวด", lowStockAt: 12, stock: 48 },
  { barcode: "8850305100011", name: "น้ำแร่เอเวียง 500ml", costPrice: 20, sellPrice: 35, unit: "ขวด", lowStockAt: 6, stock: 36 },
  { barcode: "8850305100028", name: "น้ำแร่เพอร์ริเยร์ 330ml (มีฟอง)", costPrice: 25, sellPrice: 45, unit: "กระป๋อง", lowStockAt: 6, stock: 24 },
];

// ─── น้ำผลไม้ ─────────────────────────────────────────────────────────────────
const fruitJuice = [
  { barcode: "8850306100011", name: "น้ำส้มทิปโก้ 100% 200ml", costPrice: 16, sellPrice: 28, unit: "กล่อง", lowStockAt: 12, stock: 72 },
  { barcode: "8850306100028", name: "น้ำส้มทิปโก้ 100% 1L", costPrice: 55, sellPrice: 85, unit: "กล่อง", lowStockAt: 6, stock: 36 },
  { barcode: "8850306200011", name: "น้ำส้มมาลีฟาร์ม 200ml", costPrice: 12, sellPrice: 20, unit: "กล่อง", lowStockAt: 12, stock: 60 },
  { barcode: "8850306200028", name: "น้ำส้มมาลีฟาร์ม 1L", costPrice: 38, sellPrice: 60, unit: "กล่อง", lowStockAt: 6, stock: 30 },
  { barcode: "8850306300011", name: "น้ำมะพร้าวอ่อนวีฟู้ด 350ml", costPrice: 18, sellPrice: 30, unit: "กล่อง", lowStockAt: 12, stock: 60 },
  { barcode: "8850306300028", name: "น้ำมะพร้าวอ่อนวีฟู้ด 1L", costPrice: 45, sellPrice: 68, unit: "กล่อง", lowStockAt: 6, stock: 30 },
  { barcode: "8850306400011", name: "น้ำแตงโมสด ดีน่า 250ml", costPrice: 15, sellPrice: 25, unit: "กล่อง", lowStockAt: 10, stock: 48 },
  { barcode: "8850306500011", name: "น้ำฝรั่งทิปโก้ 200ml", costPrice: 14, sellPrice: 22, unit: "กล่อง", lowStockAt: 10, stock: 48 },
  { barcode: "8850306600011", name: "น้ำสับปะรดมาลีฟาร์ม 200ml", costPrice: 12, sellPrice: 20, unit: "กล่อง", lowStockAt: 10, stock: 48 },
  { barcode: "8850306700011", name: "น้ำองุ่น กิฟฟารีน 200ml", costPrice: 12, sellPrice: 20, unit: "กล่อง", lowStockAt: 10, stock: 48 },
];

// ─── น้ำอัดลม ─────────────────────────────────────────────────────────────────
const sodas = [
  { barcode: "8850307100011", name: "โค้ก 325ml (กระป๋อง)", costPrice: 16, sellPrice: 22, unit: "กระป๋อง", lowStockAt: 24, stock: 96 },
  { barcode: "8850307100028", name: "โค้ก 500ml (ขวด)", costPrice: 18, sellPrice: 25, unit: "ขวด", lowStockAt: 24, stock: 72 },
  { barcode: "8850307100035", name: "โค้ก 1.25L (ขวด)", costPrice: 32, sellPrice: 45, unit: "ขวด", lowStockAt: 12, stock: 36 },
  { barcode: "8850307200011", name: "เป๊ปซี่ 325ml (กระป๋อง)", costPrice: 16, sellPrice: 22, unit: "กระป๋อง", lowStockAt: 24, stock: 96 },
  { barcode: "8850307200028", name: "เป๊ปซี่ 500ml (ขวด)", costPrice: 18, sellPrice: 25, unit: "ขวด", lowStockAt: 24, stock: 72 },
  { barcode: "8850307300011", name: "สไปรท์ 325ml (กระป๋อง)", costPrice: 16, sellPrice: 22, unit: "กระป๋อง", lowStockAt: 12, stock: 72 },
  { barcode: "8850307400011", name: "แฟนต้า รสส้ม 325ml (กระป๋อง)", costPrice: 16, sellPrice: 22, unit: "กระป๋อง", lowStockAt: 12, stock: 72 },
  { barcode: "8850307400028", name: "แฟนต้า รสองุ่น 325ml (กระป๋อง)", costPrice: 16, sellPrice: 22, unit: "กระป๋อง", lowStockAt: 12, stock: 60 },
  { barcode: "8850307500011", name: "เอ็ม-150 150ml (ขวด)", costPrice: 9, sellPrice: 15, unit: "ขวด", lowStockAt: 24, stock: 120 },
  { barcode: "8850307600011", name: "กระทิงแดง 150ml (กระป๋อง)", costPrice: 10, sellPrice: 18, unit: "กระป๋อง", lowStockAt: 24, stock: 96 },
  { barcode: "8850307700011", name: "เรดบูล 250ml (กระป๋อง)", costPrice: 30, sellPrice: 45, unit: "กระป๋อง", lowStockAt: 12, stock: 48 },
  { barcode: "8850307800011", name: "โซดาสิงห์ 325ml (กระป๋อง)", costPrice: 10, sellPrice: 15, unit: "กระป๋อง", lowStockAt: 12, stock: 72 },
  { barcode: "8850307900011", name: "น้ำมะนาวโซดา ยูซุ 320ml", costPrice: 18, sellPrice: 28, unit: "กระป๋อง", lowStockAt: 12, stock: 48 },
];

// ─── เครื่องดื่มชูกำลัง / Sports ──────────────────────────────────────────────
const energyDrinks = [
  { barcode: "8850308100011", name: "เกเตอเรด รสส้ม 500ml", costPrice: 22, sellPrice: 35, unit: "ขวด", lowStockAt: 12, stock: 48 },
  { barcode: "8850308100028", name: "เกเตอเรด รสมะนาว 500ml", costPrice: 22, sellPrice: 35, unit: "ขวด", lowStockAt: 12, stock: 48 },
  { barcode: "8850308200011", name: "100Plus รสดั้งเดิม 500ml", costPrice: 18, sellPrice: 28, unit: "ขวด", lowStockAt: 12, stock: 60 },
  { barcode: "8850308300011", name: "แมนซั่ม เอ็กซ์ 330ml (กระป๋อง)", costPrice: 28, sellPrice: 42, unit: "กระป๋อง", lowStockAt: 6, stock: 36 },
  { barcode: "8850308400011", name: "เพาเวอร์พลัส 500ml", costPrice: 18, sellPrice: 28, unit: "ขวด", lowStockAt: 12, stock: 48 },
];

async function main() {
  console.log("🌊 Seeding น้ำดื่ม category...");

  const category = await prisma.category.upsert({
    where: { name: "น้ำดื่ม" },
    update: {},
    create: { name: "น้ำดื่ม" },
  });

  const allProducts = [
    ...bottledWater,
    ...fruitJuice,
    ...sodas,
    ...energyDrinks,
  ];

  let created = 0;
  let skipped = 0;

  for (const p of allProducts) {
    const exists = await prisma.product.findUnique({ where: { barcode: p.barcode } });
    if (exists) { skipped++; continue; }

    const product = await prisma.product.create({
      data: {
        barcode: p.barcode,
        name: p.name,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        unit: p.unit,
        lowStockAt: p.lowStockAt,
        isActive: true,
        categoryId: category.id,
        stock: { create: { quantity: p.stock } },
      },
    });

    await prisma.stockMovement.create({
      data: {
        type: "STOCK_IN",
        quantity: p.stock,
        note: "นำเข้าข้อมูลเริ่มต้น",
        productId: product.id,
        userId: 1,
      },
    });

    created++;
  }

  console.log(`✅ หมวดน้ำดื่ม: สร้าง ${created} รายการ, ข้าม ${skipped} รายการ (มีอยู่แล้ว)`);
  console.log(`   - น้ำดื่มบรรจุขวด: ${bottledWater.length}`);
  console.log(`   - น้ำผลไม้: ${fruitJuice.length}`);
  console.log(`   - น้ำอัดลม: ${sodas.length}`);
  console.log(`   - เครื่องดื่มชูกำลัง/Sports: ${energyDrinks.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
