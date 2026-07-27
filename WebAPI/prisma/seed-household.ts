import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const household = [
  // ─── สบู่ / ครีมอาบน้ำ ───────────────────────────────────────────────────────
  { barcode: "8850101100011", name: "สบู่ลักส์ กลิ่นโรส 70g", costPrice: 18, sellPrice: 28, unit: "ก้อน", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
  { barcode: "8850101100028", name: "สบู่ลักส์ ครีมมี่เพอร์เฟคชัน 70g", costPrice: 18, sellPrice: 28, unit: "ก้อน", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
  { barcode: "8850101200011", name: "สบู่โพรเทค 65g", costPrice: 20, sellPrice: 32, unit: "ก้อน", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
  { barcode: "8850101300011", name: "ครีมอาบน้ำโดฟ 220ml", costPrice: 55, sellPrice: 75, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
  { barcode: "8850101300028", name: "ครีมอาบน้ำโดฟ 450ml", costPrice: 100, sellPrice: 135, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
  { barcode: "8850101400011", name: "ครีมอาบน้ำเซทาฟิล 250ml", costPrice: 120, sellPrice: 160, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },

  // ─── แชมพู / ครีมนวด ─────────────────────────────────────────────────────────
  { barcode: "8850102100011", name: "แชมพูซันซิล สูตรดำเงา 180ml", costPrice: 55, sellPrice: 75, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop" },
  { barcode: "8850102100028", name: "แชมพูซันซิล สูตรลดผมร่วง 180ml", costPrice: 55, sellPrice: 75, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop" },
  { barcode: "8850102200011", name: "แชมพูเฮด&โชว์เดอร์ 180ml", costPrice: 60, sellPrice: 82, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop" },
  { barcode: "8850102300011", name: "แชมพูแพนทีน 385ml", costPrice: 95, sellPrice: 130, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop" },
  { barcode: "8850102400011", name: "ครีมนวดผมโดฟ 180ml", costPrice: 58, sellPrice: 80, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop" },

  // ─── ยาสีฟัน / แปรงสีฟัน ─────────────────────────────────────────────────────
  { barcode: "8850103100011", name: "ยาสีฟันคอลเกต สูตรแบล็คชาร์โคล 150g", costPrice: 52, sellPrice: 72, unit: "หลอด", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop" },
  { barcode: "8850103100028", name: "ยาสีฟันคอลเกต สูตรไวท์เทนนิ่ง 150g", costPrice: 52, sellPrice: 72, unit: "หลอด", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop" },
  { barcode: "8850103200011", name: "ยาสีฟันซิสเท็มมา 160g", costPrice: 48, sellPrice: 65, unit: "หลอด", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop" },
  { barcode: "8850103300011", name: "แปรงสีฟันโอรัล-บี (แพ็ค 1)", costPrice: 38, sellPrice: 55, unit: "อัน", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop" },
  { barcode: "8850103400011", name: "ไหมขัดฟันโอรัล-บี 50m", costPrice: 55, sellPrice: 80, unit: "ม้วน", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop" },

  // ─── โรลออน / น้ำหอมระงับกลิ่นกาย ──────────────────────────────────────────
  { barcode: "8850104100011", name: "โรลออนนีเวีย สูตรขาว 50ml", costPrice: 58, sellPrice: 80, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=400&h=400&fit=crop" },
  { barcode: "8850104100028", name: "โรลออนนีเวีย สูตรรีแฟรช 50ml", costPrice: 58, sellPrice: 80, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=400&h=400&fit=crop" },
  { barcode: "8850104200011", name: "สเปรย์ระงับกลิ่นกายดาวน์นี่ 200ml", costPrice: 75, sellPrice: 105, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=400&h=400&fit=crop" },

  // ─── กระดาษชำระ / ทิชชู ──────────────────────────────────────────────────────
  { barcode: "8850105100011", name: "ทิชชูสก็อตต์ 1 ม้วน", costPrice: 18, sellPrice: 28, unit: "ม้วน", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
  { barcode: "8850105100028", name: "ทิชชูสก็อตต์ 6 ม้วน", costPrice: 95, sellPrice: 130, unit: "แพ็ค", lowStockAt: 10, stock: 24, imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
  { barcode: "8850105200011", name: "ทิชชูเปียก แฟมิลี่แคร์ 80 แผ่น", costPrice: 38, sellPrice: 55, unit: "ห่อ", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
  { barcode: "8850105300011", name: "กระดาษชำระวันนิสสา 12 ม้วน", costPrice: 120, sellPrice: 160, unit: "แพ็ค", lowStockAt: 8, stock: 18, imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },
  { barcode: "8850105400011", name: "กระดาษเช็ดหน้าคลีนิกซ์ 180 แผ่น", costPrice: 48, sellPrice: 65, unit: "กล่อง", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop" },

  // ─── น้ำยาล้างจาน / ผงซักฟอก ─────────────────────────────────────────────────
  { barcode: "8850106100011", name: "น้ำยาล้างจานซันไลท์ 250ml", costPrice: 22, sellPrice: 32, unit: "ขวด", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop" },
  { barcode: "8850106100028", name: "น้ำยาล้างจานซันไลท์ 500ml", costPrice: 40, sellPrice: 58, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop" },
  { barcode: "8850106200011", name: "ผงซักฟอกแอรีล 350g", costPrice: 38, sellPrice: 55, unit: "ถุง", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop" },
  { barcode: "8850106300011", name: "น้ำยาปรับผ้านุ่มดาวน์นี่ 320ml", costPrice: 45, sellPrice: 65, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop" },
  { barcode: "8850106400011", name: "น้ำยาทำความสะอาดพื้นไลซอล 500ml", costPrice: 55, sellPrice: 78, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop" },

  // ─── ผ้าอนามัย / ผลิตภัณฑ์สุขอนามัย ─────────────────────────────────────────
  { barcode: "8850107100011", name: "ผ้าอนามัยโซฟี กลางวัน 8 ชิ้น", costPrice: 28, sellPrice: 40, unit: "ห่อ", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop" },
  { barcode: "8850107100028", name: "ผ้าอนามัยโซฟี กลางคืน 6 ชิ้น", costPrice: 32, sellPrice: 45, unit: "ห่อ", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop" },
  { barcode: "8850107200011", name: "ผ้าอนามัยลอรีเอล แผ่นบาง 8 ชิ้น", costPrice: 30, sellPrice: 42, unit: "ห่อ", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop" },
  { barcode: "8850107300011", name: "ผ้าอ้อมผู้ใหญ่ เฟรนด์ S (10ชิ้น)", costPrice: 95, sellPrice: 130, unit: "แพ็ค", lowStockAt: 5, stock: 12, imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop" },

  // ─── มีดโกน / โฟมโกนหนวด ─────────────────────────────────────────────────────
  { barcode: "8850108100011", name: "มีดโกนจิลเลตต์ แมค3 (2 ชิ้น)", costPrice: 80, sellPrice: 110, unit: "แพ็ค", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&h=400&fit=crop" },
  { barcode: "8850108200011", name: "มีดโกนวีนัส (2 ชิ้น)", costPrice: 75, sellPrice: 105, unit: "แพ็ค", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&h=400&fit=crop" },
  { barcode: "8850108300011", name: "โฟมโกนหนวดจิลเลตต์ 200ml", costPrice: 65, sellPrice: 90, unit: "กระป๋อง", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&h=400&fit=crop" },

  // ─── ถุงขยะ / ของใช้ในครัว ───────────────────────────────────────────────────
  { barcode: "8850109100011", name: "ถุงขยะดำ ขนาด 24x28 นิ้ว (50 ใบ)", costPrice: 28, sellPrice: 42, unit: "แพ็ค", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&h=400&fit=crop" },
  { barcode: "8850109100028", name: "ถุงขยะดำ ขนาด 30x40 นิ้ว (20 ใบ)", costPrice: 32, sellPrice: 48, unit: "แพ็ค", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&h=400&fit=crop" },
  { barcode: "8850109200011", name: "ฟองน้ำล้างจาน (2 ชิ้น)", costPrice: 12, sellPrice: 20, unit: "แพ็ค", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&h=400&fit=crop" },
  { barcode: "8850109300011", name: "กระดาษอบอาหาร 10m", costPrice: 22, sellPrice: 35, unit: "ม้วน", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&h=400&fit=crop" },
  { barcode: "8850109400011", name: "ฟิล์มยืดห่ออาหาร 30cm x 30m", costPrice: 28, sellPrice: 42, unit: "ม้วน", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&h=400&fit=crop" },

  // ─── ยากันยุง / สเปรย์ฉีดแมลง ────────────────────────────────────────────────
  { barcode: "8850110100011", name: "ยากันยุงออฟ! โลชั่น 50ml", costPrice: 45, sellPrice: 65, unit: "ขวด", lowStockAt: 8, stock: 30, imageUrl: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=400&h=400&fit=crop" },
  { barcode: "8850110200011", name: "สเปรย์กันยุงเดตตอล 100ml", costPrice: 55, sellPrice: 80, unit: "กระป๋อง", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=400&h=400&fit=crop" },
  { barcode: "8850110300011", name: "ยาจุดกันยุง 10 ขด", costPrice: 18, sellPrice: 28, unit: "กล่อง", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=400&h=400&fit=crop" },
  { barcode: "8850110400011", name: "สเปรย์ฆ่าแมลงเรดด์ 300ml", costPrice: 65, sellPrice: 90, unit: "กระป๋อง", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=400&h=400&fit=crop" },

  // ─── ถ่านไฟฉาย / อุปกรณ์เล็กน้อย ────────────────────────────────────────────
  { barcode: "8850111100011", name: "ถ่าน AA เอเนอไจเซอร์ (2 ก้อน)", costPrice: 35, sellPrice: 52, unit: "แพ็ค", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
  { barcode: "8850111100028", name: "ถ่าน AA เอเนอไจเซอร์ (4 ก้อน)", costPrice: 65, sellPrice: 92, unit: "แพ็ค", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
  { barcode: "8850111200011", name: "ถ่าน AAA เอเนอไจเซอร์ (2 ก้อน)", costPrice: 35, sellPrice: 52, unit: "แพ็ค", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
  { barcode: "8850111300011", name: "เทปกาวใส 1 นิ้ว", costPrice: 12, sellPrice: 20, unit: "ม้วน", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
  { barcode: "8850111400011", name: "ยางรัดของ (ถุง)", costPrice: 8, sellPrice: 15, unit: "ถุง", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

async function upsertProducts(products: typeof household, categoryId: number, label: string) {
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
  console.log("🏠 กำลังนำเข้าข้อมูลของใช้ทั่วไป...\n");

  const category = await prisma.category.upsert({
    where: { name: "ของใช้ทั่วไป" },
    update: {},
    create: { name: "ของใช้ทั่วไป" },
  });

  const { created, updated } = await upsertProducts(household, category.id, "ของใช้ทั่วไป");

  const total = created + updated;
  console.log(`\n✅ เสร็จสิ้น! รวมสินค้าทั้งหมด ${total} รายการ`);
  console.log(`   🧴 สบู่/ครีมอาบน้ำ:        6 รายการ`);
  console.log(`   💆 แชมพู/ครีมนวด:          5 รายการ`);
  console.log(`   🦷 ยาสีฟัน/แปรง:           5 รายการ`);
  console.log(`   🌸 โรลออน/สเปรย์:          3 รายการ`);
  console.log(`   🧻 กระดาษชำระ/ทิชชู:       5 รายการ`);
  console.log(`   🧹 น้ำยาทำความสะอาด:       5 รายการ`);
  console.log(`   🌺 ผ้าอนามัย/สุขอนามัย:    4 รายการ`);
  console.log(`   🪒 มีดโกน/โฟม:             3 รายการ`);
  console.log(`   🛍️  ถุงขยะ/ของใช้ครัว:     5 รายการ`);
  console.log(`   🦟 ยากันยุง/สเปรย์แมลง:   4 รายการ`);
  console.log(`   🔋 ถ่าน/อุปกรณ์เล็กน้อย:  5 รายการ`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
