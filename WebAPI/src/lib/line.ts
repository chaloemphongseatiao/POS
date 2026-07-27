import { prisma } from "./prisma";

interface LineSettings {
  token: string;
  userId: string;
}

async function getLineSettings(): Promise<LineSettings | null> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["line_channel_token", "line_user_id"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (!map.line_channel_token || !map.line_user_id) return null;
  return { token: map.line_channel_token, userId: map.line_user_id };
}

export async function sendLineOrderNotification(order: {
  orderNumber: string;
  totalAmt: number | string;
  paymentMethod: string;
  itemCount: number;
  cashierName: string;
  changeAmt?: number | string;
}) {
  try {
    const settings = await getLineSettings();
    if (!settings) return; // ยังไม่ได้ตั้งค่า LINE — ข้ามไป

    const payLabel = order.paymentMethod === "CASH" ? "เงินสด" : "QR พร้อมเพย์";
    const total = Number(order.totalAmt).toLocaleString("th-TH", { minimumFractionDigits: 2 });
    const change = Number(order.changeAmt ?? 0);

    const lines = [
      `🧾 ขายสำเร็จ — ${order.orderNumber}`,
      `👤 แคชเชียร์: ${order.cashierName}`,
      `🛒 ${order.itemCount} รายการ`,
      `💰 ยอดรวม: ฿${total}`,
      `💳 ชำระ: ${payLabel}`,
      ...(order.paymentMethod === "CASH" && change > 0
        ? [`🔄 เงินทอน: ฿${change.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`]
        : []),
      `🕐 ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`,
    ];

    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.token}`,
      },
      body: JSON.stringify({
        to: settings.userId,
        messages: [{ type: "text", text: lines.join("\n") }],
      }),
    });
  } catch {
    // ไม่ block ออเดอร์ถ้า LINE ล้มเหลว
  }
}
