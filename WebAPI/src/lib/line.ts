import crypto from "crypto";
import { prisma } from "./prisma";

interface LineSettings {
  token: string;
  recipients: string[];
}

export interface LinePushResult {
  userId: string;
  ok: boolean;
  error?: string;
}

const LINE_USER_ID_RE = /^U[0-9a-f]{32}$/i;

/**
 * `line_user_id` holds one or more LINE user IDs separated by comma/whitespace/newline.
 * Invalid fragments are dropped so a stray character can't break the whole push.
 */
export function parseLineRecipients(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const ids = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => LINE_USER_ID_RE.test(s));
  return [...new Set(ids)];
}

export function isValidLineUserId(id: string): boolean {
  return LINE_USER_ID_RE.test(id);
}

async function getLineSettings(): Promise<LineSettings | null> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["line_channel_token", "line_user_id"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const token = map.line_channel_token?.trim();
  const recipients = parseLineRecipients(map.line_user_id);
  if (!token || recipients.length === 0) return null;
  return { token, recipients };
}

export async function getLineChannelSecret(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: "line_channel_secret" } });
  return row?.value ?? null;
}

export async function getLineChannelToken(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: "line_channel_token" } });
  return row?.value ?? null;
}

export function verifyLineSignature(rawBody: Buffer, signature: string, channelSecret: string): boolean {
  const expected = crypto.createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function fetchLineProfile(userId: string, channelToken: string): Promise<{ displayName: string } | null> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${channelToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { displayName: string };
    return { displayName: data.displayName };
  } catch {
    return null;
  }
}

async function pushToRecipient(
  token: string,
  userId: string,
  message: unknown
): Promise<LinePushResult> {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: userId, messages: [message] }),
    });

    if (res.ok) return { userId, ok: true };

    const body = await res.text().catch(() => "");
    return { userId, ok: false, error: `HTTP ${res.status}: ${body || "(no body)"}` };
  } catch (err) {
    return { userId, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendLineOrderNotification(order: {
  orderNumber: string;
  totalAmt: number | string;
  paymentMethod: string;
  itemCount: number;
  cashierName: string;
  changeAmt?: number | string;
}): Promise<LinePushResult[]> {
  const settings = await getLineSettings();
  if (!settings) throw new Error("ยังไม่ได้ตั้งค่า Channel Access Token หรือ User ID");

  const payLabel = order.paymentMethod === "CASH" ? "เงินสด" : "QR พร้อมเพย์";
  const total = Number(order.totalAmt).toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const change = Number(order.changeAmt ?? 0);
  const soldAt = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date());

  const detailRow = (label: string, value: string) => ({
    type: "box",
    layout: "horizontal",
    margin: "md",
    contents: [
      {
        type: "text",
        text: label,
        size: "sm",
        color: "#6B7280",
        flex: 4,
      },
      {
        type: "text",
        text: value,
        size: "sm",
        color: "#1F2937",
        align: "end",
        wrap: true,
        flex: 6,
      },
    ],
  });

  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#164E63",
      paddingAll: "20px",
      contents: [
        {
          type: "text",
          text: "TANGMARUAY POS",
          color: "#FFFFFF",
          size: "sm",
          weight: "bold",
        },
        {
          type: "text",
          text: "บันทึกการขายสำเร็จ",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm",
        },
        {
          type: "text",
          text: order.orderNumber,
          color: "#CFFAFE",
          size: "sm",
          margin: "sm",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      contents: [
        detailRow("แคชเชียร์", order.cashierName),
        detailRow("จำนวนสินค้า", `${order.itemCount} รายการ`),
        detailRow("ชำระด้วย", payLabel),
        ...(order.paymentMethod === "CASH" && change > 0
          ? [
              detailRow(
                "เงินทอน",
                `${change.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`
              ),
            ]
          : []),
        {
          type: "separator",
          margin: "xl",
          color: "#E5E7EB",
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "xl",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: "ยอดสุทธิ",
              size: "md",
              color: "#1F2937",
              weight: "bold",
              flex: 4,
            },
            {
              type: "text",
              text: `${total} บาท`,
              size: "xl",
              color: "#164E63",
              weight: "bold",
              align: "end",
              flex: 6,
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#F8FAFC",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: soldAt,
          size: "xs",
          color: "#6B7280",
          align: "center",
        },
      ],
    },
  };

  const message = {
    type: "flex",
    altText: `ขายสำเร็จ ${order.orderNumber} ยอดสุทธิ ${total} บาท`,
    contents,
  };

  const results = await Promise.all(
    settings.recipients.map((userId) => pushToRecipient(settings.token, userId, message))
  );

  if (results.every((r) => !r.ok)) {
    const detail = results.map((r) => `${r.userId} → ${r.error}`).join(" | ");
    throw new Error(`LINE push ล้มเหลวทุกปลายทาง: ${detail}`);
  }

  return results;
}
