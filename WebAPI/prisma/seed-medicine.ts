import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = [
  // ยาแก้ปวด/ลดไข้
  { barcode: "8850401100011", name: "พาราเซตามอล 500mg (แผง 10 เม็ด)", costPrice: 5, sellPrice: 10, unit: "แผง", lowStockAt: 20, stock: 100 },
  { barcode: "8850401100028", name: "ซาร่า 500mg (แผง 10 เม็ด)", costPrice: 6, sellPrice: 12, unit: "แผง", lowStockAt: 15, stock: 80 },
  { barcode: "8850401100035", name: "ไทลินอล 500mg (แผง 10 เม็ด)", costPrice: 7, sellPrice: 15, unit: "แผง", lowStockAt: 10, stock: 60 },
  { barcode: "8850401200011", name: "แอสไพริน 300mg (แผง 10 เม็ด)", costPrice: 5, sellPrice: 10, unit: "แผง", lowStockAt: 10, stock: 50 },
  { barcode: "8850401300011", name: "บรุฟเฟน 200mg (แผง 10 เม็ด)", costPrice: 18, sellPrice: 35, unit: "แผง", lowStockAt: 10, stock: 40 },
  // ยาแก้ไอ/เจ็บคอ
  { barcode: "8850402100011", name: "สตรีปซิลส์ รสมินท์ (แผง 8 เม็ด)", costPrice: 40, sellPrice: 65, unit: "แผง", lowStockAt: 10, stock: 40 },
  { barcode: "8850402100028", name: "สตรีปซิลส์ รสเลมอน (แผง 8 เม็ด)", costPrice: 40, sellPrice: 65, unit: "แผง", lowStockAt: 10, stock: 40 },
  { barcode: "8850402200011", name: "ยาแก้ไอตราหมีผึ้ง 60ml", costPrice: 28, sellPrice: 45, unit: "ขวด", lowStockAt: 6, stock: 30 },
  { barcode: "8850402300011", name: "บ๊วยมิ้นท์แก้เจ็บคอ (กล่อง 12 เม็ด)", costPrice: 12, sellPrice: 20, unit: "กล่อง", lowStockAt: 10, stock: 50 },
  // ยาทา/บรรเทาอาการ
  { barcode: "8850403100011", name: "ยาหม่องไพล ตราวัว 40g", costPrice: 18, sellPrice: 30, unit: "กระปุก", lowStockAt: 8, stock: 40 },
  { barcode: "8850403100028", name: "ยาหม่องขาวตราเสือ 22g", costPrice: 15, sellPrice: 25, unit: "กระปุก", lowStockAt: 8, stock: 40 },
  { barcode: "8850403200011", name: "โคลด์ครีมตราดาว 30ml", costPrice: 22, sellPrice: 38, unit: "หลอด", lowStockAt: 6, stock: 30 },
  { barcode: "8850403300011", name: "เบตาดีน สีน้ำตาล 30ml", costPrice: 35, sellPrice: 58, unit: "ขวด", lowStockAt: 6, stock: 25 },
  { barcode: "8850403400011", name: "แอลกอฮอล์เจล 50ml", costPrice: 18, sellPrice: 30, unit: "ขวด", lowStockAt: 12, stock: 60 },
  { barcode: "8850403500011", name: "แอลกอฮอล์ 70% 450ml", costPrice: 38, sellPrice: 60, unit: "ขวด", lowStockAt: 6, stock: 30 },
  // ผ้าพันแผล/ปฐมพยาบาล
  { barcode: "8850404100011", name: "ผ้าปิดแผล (แผง 10 ชิ้น)", costPrice: 12, sellPrice: 22, unit: "แผง", lowStockAt: 10, stock: 50 },
  { barcode: "8850404200011", name: "ผ้าพันแผล 2 นิ้ว", costPrice: 10, sellPrice: 18, unit: "ม้วน", lowStockAt: 8, stock: 30 },
  { barcode: "8850404300011", name: "สำลีก้อน (ถุง 50g)", costPrice: 12, sellPrice: 22, unit: "ถุง", lowStockAt: 8, stock: 30 },
  // วิตามิน
  { barcode: "8850405100011", name: "วิตามินซี 1000mg (แผง 10 เม็ด)", costPrice: 20, sellPrice: 35, unit: "แผง", lowStockAt: 8, stock: 40 },
  { barcode: "8850405200011", name: "แบลคมอร์ วิตามินซี 500mg (แผง)", costPrice: 35, sellPrice: 58, unit: "แผง", lowStockAt: 6, stock: 25 },
];

async function main() {
  console.log("💊 Seeding ยา/เวชภัณฑ์...");
  const cat = await prisma.category.upsert({ where: { name: "ยา/เวชภัณฑ์" }, update: {}, create: { name: "ยา/เวชภัณฑ์" } });
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
  console.log(`✅ ยา/เวชภัณฑ์: สร้าง ${created} รายการ, ข้าม ${skipped} รายการ`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
