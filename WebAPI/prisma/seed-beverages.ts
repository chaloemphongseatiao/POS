import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── เครื่องดื่มไม่มีแอลกอฮอล์ ───────────────────────────────────────────────

const nonAlcoholic = [
  // น้ำดื่ม
  { barcode: "8850006100018", name: "น้ำดื่มสิงห์ 600ml", description: "น้ำดื่มบริสุทธิ์ ตราสิงห์ 600 มล.", costPrice: 5, sellPrice: 10, unit: "ขวด", lowStockAt: 20, stock: 120, imageUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop" },
  { barcode: "8850006100025", name: "น้ำดื่มสิงห์ 1.5L", description: "น้ำดื่มบริสุทธิ์ ตราสิงห์ 1.5 ลิตร", costPrice: 10, sellPrice: 18, unit: "ขวด", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop" },
  { barcode: "8850006100032", name: "น้ำดื่มเนสท์เล่ 600ml", description: "น้ำดื่มบริสุทธิ์ เนสท์เล่ 600 มล.", costPrice: 5, sellPrice: 10, unit: "ขวด", lowStockAt: 20, stock: 100, imageUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop" },
  { barcode: "8850006100049", name: "น้ำดื่มคริสตัล 600ml", description: "น้ำดื่มบริสุทธิ์ คริสตัล 600 มล.", costPrice: 4, sellPrice: 8, unit: "ขวด", lowStockAt: 20, stock: 80, imageUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop" },
  { barcode: "8850006100056", name: "น้ำแร่เอเวียง 500ml", description: "น้ำแร่ธรรมชาติ Evian 500 มล.", costPrice: 20, sellPrice: 35, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop" },

  // น้ำอัดลม
  { barcode: "8850006150013", name: "โค้ก 325ml", description: "Coca-Cola Classic กระป๋อง 325 มล.", costPrice: 12, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 15, stock: 72, imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop" },
  { barcode: "8850006150020", name: "โค้ก 1.25L", description: "Coca-Cola Classic ขวด PET 1.25 ลิตร", costPrice: 22, sellPrice: 35, unit: "ขวด", lowStockAt: 10, stock: 40, imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop" },
  { barcode: "8850006150037", name: "โค้ก Zero 325ml", description: "Coca-Cola Zero Sugar กระป๋อง 325 มล.", costPrice: 12, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop" },
  { barcode: "8850006160014", name: "เป๊ปซี่ 325ml", description: "Pepsi กระป๋อง 325 มล.", costPrice: 11, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop" },
  { barcode: "8850006160021", name: "เป๊ปซี่ Max 325ml", description: "Pepsi Max No Sugar กระป๋อง 325 มล.", costPrice: 11, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop" },
  { barcode: "8850006170013", name: "สไปรท์ 325ml", description: "Sprite กระป๋อง 325 มล.", costPrice: 11, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=400&h=400&fit=crop" },
  { barcode: "8850400100011", name: "Est Cola 330ml", description: "EST Cola กระป๋อง 330 มล.", costPrice: 9, sellPrice: 15, unit: "กระป๋อง", lowStockAt: 12, stock: 60, imageUrl: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&h=400&fit=crop" },
  { barcode: "8850400100028", name: "Est Soda 325ml", description: "EST โซดา กระป๋อง 325 มล.", costPrice: 8, sellPrice: 15, unit: "กระป๋อง", lowStockAt: 12, stock: 60, imageUrl: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&h=400&fit=crop" },

  // ชาและกาแฟพร้อมดื่ม
  { barcode: "8850999100012", name: "ชาเขียวโออิชิ 500ml", description: "โออิชิ กรีนที รสดั้งเดิม 500 มล.", costPrice: 15, sellPrice: 25, unit: "ขวด", lowStockAt: 10, stock: 48, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850999200011", name: "ชาเขียวโออิชิ น้ำผึ้งมะนาว", description: "โออิชิ กรีนที รสน้ำผึ้งมะนาว 500 มล.", costPrice: 15, sellPrice: 25, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850999300010", name: "ชาเขียวอิชิตัน 450ml", description: "อิชิตัน กรีนที 450 มล.", costPrice: 14, sellPrice: 22, unit: "ขวด", lowStockAt: 10, stock: 40, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850999400019", name: "ชาดำเย็น ลิปตัน 500ml", description: "Lipton Ice Tea รสชาดำ 500 มล.", costPrice: 14, sellPrice: 22, unit: "ขวด", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop" },
  { barcode: "8850007200014", name: "เนสกาแฟ 3in1", description: "เนสกาแฟ 3in1 กาแฟปรุงสำเร็จ", costPrice: 5, sellPrice: 12, unit: "ซอง", lowStockAt: 30, stock: 100, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },
  { barcode: "8850007200021", name: "เนสกาแฟ Americano 180ml", description: "เนสกาแฟ กาแฟดำ กระป๋อง 180 มล.", costPrice: 12, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },
  { barcode: "8850007200038", name: "เบอร์ดี้ กาแฟ 180ml", description: "Birdy กาแฟ+นมกระป๋อง 180 มล.", costPrice: 12, sellPrice: 20, unit: "กระป๋อง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },
  { barcode: "8850007200045", name: "โบส กาแฟดำ 180ml", description: "BOSE กาแฟดำ กระป๋อง 180 มล.", costPrice: 10, sellPrice: 18, unit: "กระป๋อง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop" },

  // เครื่องดื่มชูกำลัง
  { barcode: "8850100100017", name: "กระทิงแดง 150ml", description: "กระทิงแดง เครื่องดื่มชูกำลัง 150 มล.", costPrice: 10, sellPrice: 15, unit: "กระป๋อง", lowStockAt: 20, stock: 96, imageUrl: "https://images.unsplash.com/photo-1567967455389-e432b0a98e78?w=400&h=400&fit=crop" },
  { barcode: "8850100200016", name: "เรดบูล 250ml", description: "Red Bull Energy Drink 250 มล.", costPrice: 28, sellPrice: 40, unit: "กระป๋อง", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1567967455389-e432b0a98e78?w=400&h=400&fit=crop" },
  { barcode: "8850100300015", name: "M-150 150ml", description: "M-150 เครื่องดื่มชูกำลัง 150 มล.", costPrice: 10, sellPrice: 15, unit: "ขวด", lowStockAt: 20, stock: 72, imageUrl: "https://images.unsplash.com/photo-1567967455389-e432b0a98e78?w=400&h=400&fit=crop" },
  { barcode: "8850100400014", name: "คาราบาวแดง 250ml", description: "Carabao Red เครื่องดื่มชูกำลัง 250 มล.", costPrice: 18, sellPrice: 28, unit: "กระป๋อง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1567967455389-e432b0a98e78?w=400&h=400&fit=crop" },
  { barcode: "8850100500013", name: "ลิโพ 150ml", description: "Lipovitan-D 150 มล.", costPrice: 10, sellPrice: 15, unit: "ขวด", lowStockAt: 20, stock: 60, imageUrl: "https://images.unsplash.com/photo-1567967455389-e432b0a98e78?w=400&h=400&fit=crop" },

  // นม
  { barcode: "8850200100019", name: "นมโฟร์โมสต์ รสจืด 250ml", description: "โฟร์โมสต์ UHT นมจืด 250 มล.", costPrice: 13, sellPrice: 20, unit: "กล่อง", lowStockAt: 15, stock: 60, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850200100026", name: "นมโฟร์โมสต์ รสหวาน 250ml", description: "โฟร์โมสต์ UHT นมหวาน 250 มล.", costPrice: 13, sellPrice: 20, unit: "กล่อง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850200200018", name: "มีโละ UHT 250ml", description: "Milo นมข้าวมอลต์ UHT 250 มล.", costPrice: 14, sellPrice: 22, unit: "กล่อง", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850200300017", name: "ไวตามิ้ลค์ นมถั่วเหลือง 300ml", description: "ไวตามิ้ลค์ นมถั่วเหลือง UHT 300 มล.", costPrice: 12, sellPrice: 18, unit: "กล่อง", lowStockAt: 12, stock: 60, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
  { barcode: "8850200400016", name: "โยเกิร์ตดื่มได้ Dutch Mill 180ml", description: "ดัชมิลล์ นมเปรี้ยวดื่ม 180 มล.", costPrice: 8, sellPrice: 15, unit: "ขวด", lowStockAt: 15, stock: 48, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },

  // น้ำผลไม้
  { barcode: "8850300500015", name: "น้ำส้มทิปโก้ 100% 1L", description: "ทิปโก้ น้ำส้มคั้น 100% 1 ลิตร", costPrice: 45, sellPrice: 65, unit: "กล่อง", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop" },
  { barcode: "8850300500022", name: "น้ำมะม่วงมาลีเนคตาร์ 200ml", description: "มาลี น้ำมะม่วง 200 มล.", costPrice: 10, sellPrice: 18, unit: "กล่อง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop" },
  { barcode: "8850300500039", name: "น้ำลิ้นจี่ Malee 200ml", description: "มาลี น้ำลิ้นจี่ 200 มล.", costPrice: 10, sellPrice: 18, unit: "กล่อง", lowStockAt: 12, stock: 48, imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop" },
  { barcode: "8850500300010", name: "น้ำมะพร้าว Coco Life 350ml", description: "น้ำมะพร้าว 100% 350 มล.", costPrice: 18, sellPrice: 30, unit: "กล่อง", lowStockAt: 10, stock: 30, imageUrl: "https://images.unsplash.com/photo-1550631827-4e8d9c4f8c14?w=400&h=400&fit=crop" },
  { barcode: "8850500300027", name: "น้ำมะพร้าว Coco Shake 500ml", description: "น้ำมะพร้าวแท้ 100% 500 มล.", costPrice: 25, sellPrice: 40, unit: "ขวด", lowStockAt: 8, stock: 24, imageUrl: "https://images.unsplash.com/photo-1550631827-4e8d9c4f8c14?w=400&h=400&fit=crop" },
];

// ─── เครื่องดื่มแอลกอฮอล์ ─────────────────────────────────────────────────────

const alcoholic = [
  // เบียร์
  { barcode: "8851123100011", name: "เบียร์ช้าง 330ml", description: "Chang Beer กระป๋อง 330 มล. 5% Alc.", costPrice: 35, sellPrice: 55, unit: "กระป๋อง", lowStockAt: 12, stock: 72, imageUrl: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop" },
  { barcode: "8851123100028", name: "เบียร์ช้าง ขวด 630ml", description: "Chang Beer ขวด 630 มล. 5% Alc.", costPrice: 45, sellPrice: 65, unit: "ขวด", lowStockAt: 10, stock: 48, imageUrl: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop" },
  { barcode: "8851234100010", name: "เบียร์สิงห์ 330ml", description: "Singha Beer กระป๋อง 330 มล. 5% Alc.", costPrice: 37, sellPrice: 58, unit: "กระป๋อง", lowStockAt: 12, stock: 72, imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop" },
  { barcode: "8851234100027", name: "เบียร์สิงห์ ขวด 630ml", description: "Singha Beer ขวด 630 มล. 5% Alc.", costPrice: 48, sellPrice: 70, unit: "ขวด", lowStockAt: 10, stock: 48, imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop" },
  { barcode: "8851345100019", name: "เบียร์ลีโอ 330ml", description: "Leo Beer กระป๋อง 330 มล. 5% Alc.", costPrice: 33, sellPrice: 52, unit: "กระป๋อง", lowStockAt: 12, stock: 60, imageUrl: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400&h=400&fit=crop" },
  { barcode: "8851345100026", name: "เบียร์ลีโอ ขวด 630ml", description: "Leo Beer ขวด 630 มล. 5% Alc.", costPrice: 43, sellPrice: 62, unit: "ขวด", lowStockAt: 10, stock: 48, imageUrl: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400&h=400&fit=crop" },
  { barcode: "8851456100018", name: "เบียร์ไทเกอร์ 330ml", description: "Tiger Beer กระป๋อง 330 มล. 5% Alc.", costPrice: 38, sellPrice: 58, unit: "กระป๋อง", lowStockAt: 10, stock: 48, imageUrl: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop" },
  { barcode: "8851567100017", name: "เบียร์ไฮเนเก้น 330ml", description: "Heineken Beer กระป๋อง 330 มล. 5% Alc.", costPrice: 45, sellPrice: 68, unit: "กระป๋อง", lowStockAt: 10, stock: 36, imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop" },
  { barcode: "8851678100016", name: "เบียร์ช้าง คูล 330ml", description: "Chang Cool ลดแอลกอฮอล์ 3.5% กระป๋อง 330 มล.", costPrice: 33, sellPrice: 52, unit: "กระป๋อง", lowStockAt: 10, stock: 48, imageUrl: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop" },
  { barcode: "8851789100015", name: "เบียร์อาชา 330ml", description: "Archa Beer กระป๋อง 330 มล. 5% Alc.", costPrice: 30, sellPrice: 48, unit: "กระป๋อง", lowStockAt: 12, stock: 60, imageUrl: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400&h=400&fit=crop" },

  // สุราขาว / สุราผสม
  { barcode: "8852100100014", name: "เหล้าหงส์ทอง 350ml", description: "หงส์ทอง สุรากลั่น 28% Alc. 350 มล.", costPrice: 85, sellPrice: 120, unit: "ขวด", lowStockAt: 6, stock: 24, imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { barcode: "8852100100021", name: "เหล้าหงส์ทอง 700ml", description: "หงส์ทอง สุรากลั่น 28% Alc. 700 มล.", costPrice: 155, sellPrice: 220, unit: "ขวด", lowStockAt: 5, stock: 18, imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { barcode: "8852200100013", name: "เหล้าแม่โขง 350ml", description: "แม่โขง สุรา 40% Alc. 350 มล.", costPrice: 130, sellPrice: 185, unit: "ขวด", lowStockAt: 5, stock: 18, imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { barcode: "8852200100020", name: "เหล้าแม่โขง 700ml", description: "แม่โขง สุรา 40% Alc. 700 มล.", costPrice: 240, sellPrice: 340, unit: "ขวด", lowStockAt: 4, stock: 12, imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { barcode: "8852300100012", name: "เหล้ารีเจนซี่ VSOP 350ml", description: "Regency VSOP Brandy 40% Alc. 350 มล.", costPrice: 145, sellPrice: 210, unit: "ขวด", lowStockAt: 5, stock: 12, imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { barcode: "8852400100011", name: "รัม Sang Som 375ml", description: "แสงโสม รัม 40% Alc. 375 มล.", costPrice: 135, sellPrice: 195, unit: "ขวด", lowStockAt: 5, stock: 18, imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { barcode: "8852400100028", name: "รัม Sang Som 700ml", description: "แสงโสม รัม 40% Alc. 700 มล.", costPrice: 240, sellPrice: 345, unit: "ขวด", lowStockAt: 4, stock: 12, imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { barcode: "8852500100010", name: "เหล้าขาวเถื่อน... เจ้าสัว 350ml", description: "เจ้าสัว สุราขาว 28% Alc. 350 มล.", costPrice: 70, sellPrice: 100, unit: "ขวด", lowStockAt: 6, stock: 24, imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop" },
  { barcode: "8852600100019", name: "วิสกี้ Johnnie Walker Red 700ml", description: "Johnnie Walker Red Label Whisky 40% Alc.", costPrice: 480, sellPrice: 680, unit: "ขวด", lowStockAt: 3, stock: 8, imageUrl: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop" },
  { barcode: "8852700100018", name: "วิสกี้ Ballantine's Finest 700ml", description: "Ballantine's Finest Scotch Whisky 40% Alc.", costPrice: 520, sellPrice: 750, unit: "ขวด", lowStockAt: 3, stock: 6, imageUrl: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop" },

  // ไวน์
  { barcode: "8853100100017", name: "ไวน์แดง Casillero del Diablo 750ml", description: "Casillero del Diablo Red Wine 13.5% Alc.", costPrice: 280, sellPrice: 420, unit: "ขวด", lowStockAt: 3, stock: 12, imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop" },
  { barcode: "8853200100016", name: "ไวน์ขาว Yellow Tail 750ml", description: "Yellow Tail Chardonnay White Wine 13% Alc.", costPrice: 250, sellPrice: 380, unit: "ขวด", lowStockAt: 3, stock: 10, imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop" },
  { barcode: "8853300100015", name: "สปาร์กลิ้งไวน์ Martini Asti 750ml", description: "Martini Asti Sparkling Wine 7.5% Alc.", costPrice: 320, sellPrice: 480, unit: "ขวด", lowStockAt: 3, stock: 8, imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop" },

  // แอลกอฮอล์ผสมพร้อมดื่ม (RTD)
  { barcode: "8854100100016", name: "Smirnoff Ice 330ml", description: "Smirnoff Ice เครื่องดื่มผสม 4% Alc.", costPrice: 45, sellPrice: 65, unit: "ขวด", lowStockAt: 8, stock: 36, imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop" },
  { barcode: "8854200100015", name: "Tiger Seltzer 330ml", description: "Tiger Seltzer Hard Seltzer 4.5% Alc.", costPrice: 40, sellPrice: 60, unit: "กระป๋อง", lowStockAt: 8, stock: 36, imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop" },
  { barcode: "8854300100014", name: "ชาบูดู Budu Mix 330ml", description: "เครื่องดื่มผสมสุรา รสมะนาว 5% Alc.", costPrice: 35, sellPrice: 55, unit: "กระป๋อง", lowStockAt: 8, stock: 48, imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop" },
];

async function main() {
  console.log("🍺 กำลังนำเข้าข้อมูลเครื่องดื่ม...\n");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("ไม่พบ admin user — รัน seed หลักก่อน");

  // ─── หมวด: เครื่องดื่ม ────────────────────────────────────────────
  const catBeverage = await prisma.category.upsert({
    where: { name: "เครื่องดื่ม" },
    update: {},
    create: { name: "เครื่องดื่ม" },
  });

  // ─── หมวด: เครื่องดื่มแอลกอฮอล์ ─────────────────────────────────
  const catAlcohol = await prisma.category.upsert({
    where: { name: "เครื่องดื่มแอลกอฮอล์" },
    update: {},
    create: { name: "เครื่องดื่มแอลกอฮอล์" },
  });

  async function upsertProducts(
    products: typeof nonAlcoholic,
    categoryId: number,
    label: string
  ) {
    let created = 0, updated = 0;
    for (const item of products) {
      const existing = await prisma.product.findUnique({ where: { barcode: item.barcode } });
      if (existing) {
        await prisma.product.update({
          where: { barcode: item.barcode },
          data: {
            name: item.name,
            description: item.description,
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
            imageUrl: item.imageUrl,
            lowStockAt: item.lowStockAt,
            categoryId,
          },
        });
        updated++;
      } else {
        const product = await prisma.product.create({
          data: {
            barcode: item.barcode,
            name: item.name,
            description: item.description,
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
            unit: item.unit,
            imageUrl: item.imageUrl,
            lowStockAt: item.lowStockAt,
            categoryId,
          },
        });
        await prisma.stock.create({ data: { productId: product.id, quantity: item.stock } });
        await prisma.stockMovement.create({
          data: {
            type: "STOCK_IN",
            quantity: item.stock,
            note: "นำเข้าข้อมูลตัวอย่าง",
            productId: product.id,
            userId: admin.id,
          },
        });
        created++;
      }
    }
    console.log(`📦 ${label}: เพิ่มใหม่ ${created} รายการ, อัปเดต ${updated} รายการ`);
    return { created, updated };
  }

  const r1 = await upsertProducts(nonAlcoholic, catBeverage.id, "เครื่องดื่ม (ไม่มีแอลกอฮอล์)");
  const r2 = await upsertProducts(alcoholic, catAlcohol.id, "เครื่องดื่มแอลกอฮอล์");

  const total = r1.created + r2.created;
  console.log(`\n✅ เสร็จสิ้น! รวมเพิ่มสินค้าใหม่ทั้งหมด ${total} รายการ`);
  console.log(`   🧃 เครื่องดื่ม:           ${nonAlcoholic.length} รายการ`);
  console.log(`   🍺 เครื่องดื่มแอลกอฮอล์: ${alcoholic.length} รายการ`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
