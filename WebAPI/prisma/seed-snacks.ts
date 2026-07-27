import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── ขนมขบเคี้ยว ──────────────────────────────────────────────────────────────

const snacks = [
  // เลย์ (Lay's)
  { barcode: "8850714100011", name: "เลย์ รสออริจินัล 48g", costPrice: 12, sellPrice: 20, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850714100028", name: "เลย์ รสบาร์บีคิว 48g", costPrice: 12, sellPrice: 20, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850714100035", name: "เลย์ รสเส้นสาหร่าย 48g", costPrice: 12, sellPrice: 20, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850714100042", name: "เลย์ รสต้มยำกุ้ง 48g", costPrice: 12, sellPrice: 20, unit: "ถุง", lowStockAt: 20, stock: 48, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850714100059", name: "เลย์ รสซาวครีมหัวหอม 48g", costPrice: 12, sellPrice: 20, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850714100066", name: "เลย์ แม็กซ์ รสออริจินัล 54g", costPrice: 15, sellPrice: 25, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850714100073", name: "เลย์ แม็กซ์ รสบาร์บีคิว 54g", costPrice: 15, sellPrice: 25, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },

  // ตะวัน (Tawan)
  { barcode: "8850011200011", name: "ตะวัน รสออริจินัล 50g", costPrice: 8, sellPrice: 15, unit: "ถุง", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850011200028", name: "ตะวัน รสบาร์บีคิว 50g", costPrice: 8, sellPrice: 15, unit: "ถุง", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850011200035", name: "ตะวัน รสสาหร่าย 50g", costPrice: 8, sellPrice: 15, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850011200042", name: "ตะวัน รสต้มยำ 50g", costPrice: 8, sellPrice: 15, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850011200059", name: "ตะวัน รสชีส 50g", costPrice: 8, sellPrice: 15, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850011200066", name: "ตะวัน บิ๊กแพ็ค รสออริจินัล 100g", costPrice: 16, sellPrice: 28, unit: "ถุง", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },

  // ปาร์ตี้ (Party)
  { barcode: "8850022300011", name: "ปาร์ตี้ รสออริจินัล 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1535655685871-dc8158ff167b?w=400&h=400&fit=crop" },
  { barcode: "8850022300028", name: "ปาร์ตี้ รสบาร์บีคิว 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1535655685871-dc8158ff167b?w=400&h=400&fit=crop" },
  { barcode: "8850022300035", name: "ปาร์ตี้ รสเผ็ด 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1535655685871-dc8158ff167b?w=400&h=400&fit=crop" },
  { barcode: "8850022300042", name: "ปาร์ตี้ รสสาหร่าย 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1535655685871-dc8158ff167b?w=400&h=400&fit=crop" },
  { barcode: "8850022300059", name: "ปาร์ตี้ รสชีสพริก 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 15, stock: 36, imageUrl: "https://images.unsplash.com/photo-1535655685871-dc8158ff167b?w=400&h=400&fit=crop" },

  // ปาปิก้า (Paprika)
  { barcode: "8850033400011", name: "ปาปิก้า รสออริจินัล 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850033400028", name: "ปาปิก้า รสบาร์บีคิว 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850033400035", name: "ปาปิก้า รสต้มยำ 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850033400042", name: "ปาปิก้า รสชีส 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },
  { barcode: "8850033400059", name: "ปาปิก้า รสสาหร่าย 55g", costPrice: 10, sellPrice: 18, unit: "ถุง", lowStockAt: 15, stock: 36, imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop" },

  // โดริโทส (Doritos)
  { barcode: "8850714200011", name: "โดริโทส รสนาโช่ชีส 50g", costPrice: 14, sellPrice: 25, unit: "ถุง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850714200028", name: "โดริโทส รสสปายซี่เนชอส 50g", costPrice: 14, sellPrice: 25, unit: "ถุง", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850714200035", name: "โดริโทส รส BBQ 50g", costPrice: 14, sellPrice: 25, unit: "ถุง", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },

  // ช้าง (Chang — ข้าวเกรียบกุ้ง / Thai snacks)
  { barcode: "8850044500011", name: "ข้าวเกรียบกุ้ง 30g", costPrice: 5, sellPrice: 10, unit: "ถุง", lowStockAt: 30, stock: 120, imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },
  { barcode: "8850044500028", name: "ข้าวเกรียบปลา 30g", costPrice: 5, sellPrice: 10, unit: "ถุง", lowStockAt: 30, stock: 100, imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },
  { barcode: "8850044500035", name: "มันฝรั่งทอดกรอบ 30g", costPrice: 5, sellPrice: 10, unit: "ถุง", lowStockAt: 30, stock: 100, imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },

  // โปเต้ (Pote)
  { barcode: "8850055600011", name: "โปเต้ รสออริจินัล 45g", costPrice: 9, sellPrice: 15, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850055600028", name: "โปเต้ รสบาร์บีคิว 45g", costPrice: 9, sellPrice: 15, unit: "ถุง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850055600035", name: "โปเต้ รสชีส 45g", costPrice: 9, sellPrice: 15, unit: "ถุง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },
  { barcode: "8850055600042", name: "โปเต้ รสพริกไทย 45g", costPrice: 9, sellPrice: 15, unit: "ถุง", lowStockAt: 15, stock: 36, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop" },

  // คิดคิต / เวเฟอร์ / คุกกี้
  { barcode: "8850066700011", name: "คิทแคท ช็อกโกแลต 35g", costPrice: 15, sellPrice: 25, unit: "ชิ้น", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop" },
  { barcode: "8850066700028", name: "คิทแคท สตรอเบอรี่ 35g", costPrice: 15, sellPrice: 25, unit: "ชิ้น", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop" },
  { barcode: "8850066800011", name: "โอรีโอ ช็อกโกแลต 39.6g", costPrice: 12, sellPrice: 20, unit: "ห่อ", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=400&h=400&fit=crop" },
  { barcode: "8850066800028", name: "โอรีโอ วานิลลา 39.6g", costPrice: 12, sellPrice: 20, unit: "ห่อ", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=400&h=400&fit=crop" },
  { barcode: "8850066900011", name: "ไทม์ เวเฟอร์ช็อกโกแลต 45g", costPrice: 8, sellPrice: 15, unit: "ห่อ", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop" },
  { barcode: "8850066900028", name: "ไทม์ เวเฟอร์วานิลลา 45g", costPrice: 8, sellPrice: 15, unit: "ห่อ", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop" },

  // ลูกอม / หมากฝรั่ง
  { barcode: "8850077100011", name: "อัลเพนลีเบ รสน้ำผึ้ง 49.5g", costPrice: 10, sellPrice: 18, unit: "ห่อ", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },
  { barcode: "8850077100028", name: "อัลเพนลีเบ รสสตรอเบอรี่ 49.5g", costPrice: 10, sellPrice: 18, unit: "ห่อ", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },
  { barcode: "8850077200011", name: "ฮอลล์ส รสเมนทอล 33.5g", costPrice: 8, sellPrice: 15, unit: "ซอง", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },
  { barcode: "8850077200028", name: "ฮอลล์ส รสสตรอเบอรี่ 33.5g", costPrice: 8, sellPrice: 15, unit: "ซอง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },
  { barcode: "8850077300011", name: "หมากฝรั่งดับเบิ้ลมิ้นท์ 7.2g", costPrice: 3, sellPrice: 6, unit: "แผง", lowStockAt: 30, stock: 100, imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },
  { barcode: "8850077300028", name: "หมากฝรั่งเอ็กซ์ตรา 14.4g", costPrice: 6, sellPrice: 10, unit: "ห่อ", lowStockAt: 30, stock: 80, imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },

  // ขนมไทย / ขนมกรุบกรอบ
  { barcode: "8850088200011", name: "เส้นหมี่กรอบ รสต้มยำ 55g", costPrice: 7, sellPrice: 12, unit: "ถุง", lowStockAt: 25, stock: 80, imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },
  { barcode: "8850088200028", name: "เส้นหมี่กรอบ รสออริจินัล 55g", costPrice: 7, sellPrice: 12, unit: "ถุง", lowStockAt: 25, stock: 80, imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },
  { barcode: "8850088300011", name: "ปลาหมึกอบ รสหวาน 20g", costPrice: 8, sellPrice: 15, unit: "ซอง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },
  { barcode: "8850088300028", name: "ปลาหมึกอบ รสเผ็ด 20g", costPrice: 8, sellPrice: 15, unit: "ซอง", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },
  { barcode: "8850088400011", name: "หมูแผ่นอบกรอบ 25g", costPrice: 12, sellPrice: 22, unit: "ซอง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop" },
  { barcode: "8850088500011", name: "บิสกิตซันด์วิชช็อกโกแลต 35g", costPrice: 6, sellPrice: 12, unit: "ห่อ", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop" },
  { barcode: "8850088500028", name: "บิสกิตซันด์วิชวานิลลา 35g", costPrice: 6, sellPrice: 12, unit: "ห่อ", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop" },

  // ช็อกโกแลต / ทอฟฟี่
  { barcode: "8850099100011", name: "สนิคเกอร์ 50g", costPrice: 22, sellPrice: 35, unit: "ชิ้น", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop" },
  { barcode: "8850099100028", name: "มาร์ส 50g", costPrice: 22, sellPrice: 35, unit: "ชิ้น", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop" },
  { barcode: "8850099200011", name: "ทอฟฟี่นมสีดา 50g", costPrice: 8, sellPrice: 15, unit: "ห่อ", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },
  { barcode: "8850099200028", name: "ทอฟฟี่โกโก้ 50g", costPrice: 8, sellPrice: 15, unit: "ห่อ", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

async function upsertProducts(
  products: typeof snacks,
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
      const product = await prisma.product.create({
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
  console.log("🍿 กำลังนำเข้าข้อมูลขนม...\n");

  // สร้าง/หา category ขนม
  const snackCategory = await prisma.category.upsert({
    where: { name: "ขนม" },
    update: {},
    create: { name: "ขนม" },
  });

  const { created, updated } = await upsertProducts(snacks, snackCategory.id, "ขนม");

  console.log(`\n✅ เสร็จสิ้น! รวมสินค้าขนมทั้งหมด ${created + updated} รายการ`);
  console.log(`   🍿 ขนม: ${created + updated} รายการ`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
