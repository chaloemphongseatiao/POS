import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Settings
  await prisma.setting.upsert({
    where: { key: "store_name" },
    update: {},
    create: { key: "store_name", value: "ร้านค้า SME ของฉัน" },
  });
  await prisma.setting.upsert({
    where: { key: "store_address" },
    update: {},
    create: { key: "store_address", value: "123 ถนนตัวอย่าง กรุงเทพฯ 10000" },
  });

  // Users
  const adminHash = await bcrypt.hash("admin1234", 10);
  const cashierHash = await bcrypt.hash("cashier1234", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminHash,
      displayName: "ผู้ดูแลระบบ",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { username: "cashier" },
    update: {},
    create: {
      username: "cashier",
      passwordHash: cashierHash,
      displayName: "พนักงานแคชเชียร์",
      role: "CASHIER",
    },
  });

  // Categories
  const cat1 = await prisma.category.upsert({
    where: { name: "เครื่องดื่ม" },
    update: {},
    create: { name: "เครื่องดื่ม" },
  });
  const cat2 = await prisma.category.upsert({
    where: { name: "ขนม/อาหาร" },
    update: {},
    create: { name: "ขนม/อาหาร" },
  });
  const cat3 = await prisma.category.upsert({
    where: { name: "ของใช้ทั่วไป" },
    update: {},
    create: { name: "ของใช้ทั่วไป" },
  });

  // Products
  const products = [
    { barcode: "8850006100018", name: "น้ำเปล่าตราสิงห์ 600ml", costPrice: 5, sellPrice: 10, unit: "ขวด", categoryId: cat1.id, stock: 100, lowStockAt: 5 },
    { barcode: "8850006150013", name: "โค้ก 325ml", costPrice: 12, sellPrice: 20, unit: "กระป๋อง", categoryId: cat1.id, stock: 60, lowStockAt: 5 },
    { barcode: "8850999100012", name: "ชาเขียวโออิชิ 500ml", costPrice: 15, sellPrice: 25, unit: "ขวด", categoryId: cat1.id, stock: 4, lowStockAt: 10 },
    { barcode: "8850007200014", name: "กาแฟเนสกาแฟ 3in1", costPrice: 5, sellPrice: 12, unit: "ซอง", categoryId: cat1.id, stock: 50, lowStockAt: 5 },
    { barcode: "8850300100019", name: "มาม่าต้มยำกุ้ง", costPrice: 6, sellPrice: 8, unit: "ซอง", categoryId: cat2.id, stock: 80, lowStockAt: 5 },
    { barcode: "8850300200011", name: "เลย์รสออริจินัล", costPrice: 10, sellPrice: 20, unit: "ถุง", categoryId: cat2.id, stock: 30, lowStockAt: 5 },
    { barcode: "8850400100015", name: "ขนมปังแผ่นฟาร์มเฮ้าส์", costPrice: 28, sellPrice: 38, unit: "ถุง", categoryId: cat2.id, stock: 15, lowStockAt: 5 },
    { barcode: "8850500100016", name: "สบู่เหลวลักส์", costPrice: 45, sellPrice: 75, unit: "ขวด", categoryId: cat3.id, stock: 20, lowStockAt: 5 },
    { barcode: "8850500200018", name: "ยาสีฟันคอลเกต 150g", costPrice: 35, sellPrice: 55, unit: "หลอด", categoryId: cat3.id, stock: 25, lowStockAt: 5 },
    { barcode: "8850600100013", name: "กระดาษทิชชู่ 1 ม้วน", costPrice: 8, sellPrice: 15, unit: "ม้วน", categoryId: cat3.id, stock: 3, lowStockAt: 10 },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { barcode: p.barcode } });
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          barcode: p.barcode,
          name: p.name,
          costPrice: p.costPrice,
          sellPrice: p.sellPrice,
          unit: p.unit,
          categoryId: p.categoryId,
          lowStockAt: p.lowStockAt,
        },
      });
      await prisma.stock.create({ data: { productId: product.id, quantity: p.stock } });
      await prisma.stockMovement.create({
        data: {
          type: "STOCK_IN",
          quantity: p.stock,
          note: "ยอดยกมา (seed)",
          productId: product.id,
          userId: admin.id,
        },
      });
    }
  }

  console.log("✅ Seed complete!");
  console.log("   Admin:    admin / admin1234");
  console.log("   Cashier:  cashier / cashier1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
