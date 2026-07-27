import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const instantFood = [
  // ─── บะหมี่กึ่งสำเร็จรูป ──────────────────────────────────────────────────
  { barcode: "8850301100011", name: "มาม่า รสต้มยำกุ้ง 60g", costPrice: 5, sellPrice: 8, unit: "ซอง", lowStockAt: 30, stock: 200, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850301100028", name: "มาม่า รสหมูสับ 60g", costPrice: 5, sellPrice: 8, unit: "ซอง", lowStockAt: 30, stock: 200, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850301100035", name: "มาม่า รสไก่ 60g", costPrice: 5, sellPrice: 8, unit: "ซอง", lowStockAt: 30, stock: 150, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850301100042", name: "มาม่า รสเนื้อ 60g", costPrice: 5, sellPrice: 8, unit: "ซอง", lowStockAt: 25, stock: 120, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850301100059", name: "มาม่า รสผัดขี้เมา 60g", costPrice: 5, sellPrice: 8, unit: "ซอง", lowStockAt: 25, stock: 100, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850301100066", name: "มาม่า คัพ รสต้มยำกุ้ง 70g", costPrice: 8, sellPrice: 15, unit: "ถ้วย", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850301100073", name: "มาม่า คัพ รสหมูสับ 70g", costPrice: 8, sellPrice: 15, unit: "ถ้วย", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850302100011", name: "ไวไว รสต้มยำ 55g", costPrice: 4, sellPrice: 7, unit: "ซอง", lowStockAt: 25, stock: 150, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850302100028", name: "ไวไว รสหมู 55g", costPrice: 4, sellPrice: 7, unit: "ซอง", lowStockAt: 25, stock: 120, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850303100011", name: "ยำยำ รสต้มยำทะเล 60g", costPrice: 5, sellPrice: 8, unit: "ซอง", lowStockAt: 20, stock: 100, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850303100028", name: "ยำยำ คัพ รสต้มยำ 65g", costPrice: 8, sellPrice: 15, unit: "ถ้วย", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850304100011", name: "ซื่อสัตย์ รสต้มยำ 55g", costPrice: 4, sellPrice: 7, unit: "ซอง", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },

  // ─── ปลากระป๋อง ───────────────────────────────────────────────────────────
  { barcode: "8850305100011", name: "ปลาซาร์ดีนในซอสมะเขือเทศ 155g", costPrice: 22, sellPrice: 32, unit: "กระป๋อง", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1611171711791-b34df5dcc28b?w=400&h=400&fit=crop" },
  { barcode: "8850305100028", name: "ปลาซาร์ดีนในซอสพริก 155g", costPrice: 22, sellPrice: 32, unit: "กระป๋อง", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1611171711791-b34df5dcc28b?w=400&h=400&fit=crop" },
  { barcode: "8850305200011", name: "ปลาทูนาในน้ำเกลือ 185g", costPrice: 38, sellPrice: 55, unit: "กระป๋อง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1611171711791-b34df5dcc28b?w=400&h=400&fit=crop" },
  { barcode: "8850305200028", name: "ปลาทูนาในน้ำมัน 185g", costPrice: 38, sellPrice: 55, unit: "กระป๋อง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1611171711791-b34df5dcc28b?w=400&h=400&fit=crop" },
  { barcode: "8850305300011", name: "ปลาแมคเคอเรลในซอสมะเขือเทศ 425g", costPrice: 45, sellPrice: 65, unit: "กระป๋อง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1611171711791-b34df5dcc28b?w=400&h=400&fit=crop" },
  { barcode: "8850305300028", name: "ปลาแมคเคอเรลในซอสพริกไทยดำ 425g", costPrice: 45, sellPrice: 65, unit: "กระป๋อง", lowStockAt: 12, stock: 36, imageUrl: "https://images.unsplash.com/photo-1611171711791-b34df5dcc28b?w=400&h=400&fit=crop" },
  { barcode: "8850305400011", name: "ปลากระป๋องตราปลาไทย ซอสพริก 155g", costPrice: 20, sellPrice: 30, unit: "กระป๋อง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1611171711791-b34df5dcc28b?w=400&h=400&fit=crop" },

  // ─── เนื้อสัตว์กระป๋อง / พร้อมทาน ────────────────────────────────────────
  { barcode: "8850306100011", name: "ไก่กระป๋อง เนื้อไก่ฉีก 165g", costPrice: 45, sellPrice: 65, unit: "กระป๋อง", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1611171711791-b34df5dcc28b?w=400&h=400&fit=crop" },
  { barcode: "8850306200011", name: "กุนเชียงหมู 200g", costPrice: 55, sellPrice: 80, unit: "ห่อ", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
  { barcode: "8850306300011", name: "แฮมหมูสไลซ์ 100g", costPrice: 35, sellPrice: 52, unit: "ห่อ", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
  { barcode: "8850306400011", name: "ไส้กรอกอีสาน 200g", costPrice: 40, sellPrice: 58, unit: "ห่อ", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },

  // ─── ข้าวกล่อง / อาหารกึ่งสำเร็จรูป ─────────────────────────────────────
  { barcode: "8850307100011", name: "ข้าวต้มคัพ รสหมู 52g", costPrice: 12, sellPrice: 20, unit: "ถ้วย", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850307100028", name: "ข้าวต้มคัพ รสไก่ 52g", costPrice: 12, sellPrice: 20, unit: "ถ้วย", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850307200011", name: "โจ๊กคัพ รสหมู 50g", costPrice: 10, sellPrice: 18, unit: "ถ้วย", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop" },
  { barcode: "8850307300011", name: "แกงเขียวหวานไก่ พร้อมทาน 200g", costPrice: 38, sellPrice: 55, unit: "ถุง", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
  { barcode: "8850307300028", name: "แกงเผ็ดเนื้อ พร้อมทาน 200g", costPrice: 40, sellPrice: 58, unit: "ถุง", lowStockAt: 10, stock: 24, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
  { barcode: "8850307400011", name: "ข้าวกล่องไมโครเวฟ ผัดกะเพรา 250g", costPrice: 45, sellPrice: 65, unit: "กล่อง", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
  { barcode: "8850307400028", name: "ข้าวกล่องไมโครเวฟ ข้าวมันไก่ 250g", costPrice: 45, sellPrice: 65, unit: "กล่อง", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },

  // ─── เครื่องปรุง / ซอส ────────────────────────────────────────────────────
  { barcode: "8850308100011", name: "ซอสพริกศรีราชา 570ml", costPrice: 42, sellPrice: 60, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850308200011", name: "น้ำปลาทิพรส 700ml", costPrice: 32, sellPrice: 48, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850308300011", name: "ซีอิ๊วขาวรสดี 700ml", costPrice: 28, sellPrice: 42, unit: "ขวด", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850308400011", name: "น้ำมันหอยแม่ประนอม 300ml", costPrice: 48, sellPrice: 68, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850308500011", name: "มายองเนสเฮลแมน 400g", costPrice: 65, sellPrice: 90, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850308600011", name: "ผงชูรส 200g", costPrice: 18, sellPrice: 28, unit: "ซอง", lowStockAt: 10, stock: 48, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },

  // ─── ข้าวสาร / แป้ง / ธัญพืช ─────────────────────────────────────────────
  { barcode: "8850309100011", name: "ข้าวสารหอมมะลิ 1kg", costPrice: 38, sellPrice: 55, unit: "ถุง", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop" },
  { barcode: "8850309100028", name: "ข้าวสารหอมมะลิ 5kg", costPrice: 185, sellPrice: 260, unit: "ถุง", lowStockAt: 5, stock: 12, imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop" },
  { barcode: "8850309200011", name: "แป้งสาลีตราฉัตร 1kg", costPrice: 28, sellPrice: 42, unit: "ถุง", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop" },
  { barcode: "8850309300011", name: "น้ำตาลทรายขาว 1kg", costPrice: 22, sellPrice: 32, unit: "ถุง", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
  { barcode: "8850309400011", name: "เกลือป่น 500g", costPrice: 8, sellPrice: 15, unit: "ถุง", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop" },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

async function upsertProducts(products: typeof instantFood, categoryId: number, label: string) {
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
  console.log("🍜 กำลังนำเข้าข้อมูลอาหารสำเร็จรูป...\n");

  const category = await prisma.category.upsert({
    where: { name: "อาหารสำเร็จรูป" },
    update: {},
    create: { name: "อาหารสำเร็จรูป" },
  });

  const r1 = await upsertProducts(instantFood.slice(0, 12), category.id, "บะหมี่กึ่งสำเร็จรูป");
  const r2 = await upsertProducts(instantFood.slice(12, 20), category.id, "ปลากระป๋อง/เนื้อสัตว์กระป๋อง");
  const r3 = await upsertProducts(instantFood.slice(20, 32), category.id, "ข้าวกล่อง/อาหารพร้อมทาน/เครื่องปรุง");
  const r4 = await upsertProducts(instantFood.slice(32), category.id, "ข้าวสาร/แป้ง/ธัญพืช");

  const total = [r1, r2, r3, r4].reduce((s, r) => s + r.created + r.updated, 0);
  console.log(`\n✅ เสร็จสิ้น! รวมสินค้าทั้งหมด ${total} รายการ`);
  console.log(`   🍜 บะหมี่กึ่งสำเร็จรูป:              12 รายการ`);
  console.log(`   🐟 ปลากระป๋อง/เนื้อสัตว์กระป๋อง:    8 รายการ`);
  console.log(`   🍱 ข้าวกล่อง/อาหารพร้อมทาน/เครื่องปรุง: 12 รายการ`);
  console.log(`   🌾 ข้าวสาร/แป้ง/ธัญพืช:              5 รายการ`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
