import { Request, Response, NextFunction } from "express";
import * as svc from "./settings.service";
import {
  sendLineOrderNotification,
  parseLineRecipients,
  isValidLineUserId,
  getLineDiagnostics,
} from "../../lib/line";
import { createError } from "../../middleware/errorHandler";

const ALLOWED_SETTING_KEYS = new Set([
  "store_name",
  "store_address",
  "store_logo",
  "line_channel_token",
  "line_channel_secret",
  "line_user_id",
]);

function validateSetting(key: unknown, value: unknown): asserts key is string {
  if (typeof key !== "string" || !ALLOWED_SETTING_KEYS.has(key)) {
    throw createError("Invalid setting key", 400);
  }
  if (typeof value !== "string") {
    throw createError("Setting value must be a string", 400);
  }
  if (key === "line_user_id" && value.trim() !== "") {
    const parsed = parseLineRecipients(value);
    const invalid = value
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s !== "" && !isValidLineUserId(s));
    if (invalid.length > 0) {
      throw createError(`User ID ไม่ถูกต้อง: ${invalid.join(", ")} (ต้องขึ้นต้นด้วย U ตามด้วยตัวอักษร/ตัวเลข 32 ตัว)`, 400);
    }
    if (parsed.length === 0) {
      throw createError("ต้องระบุ User ID อย่างน้อย 1 รายการ", 400);
    }
  }
  if (key === "store_logo") {
    if (value === "") return;

    const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) {
      throw createError("รองรับไฟล์ PNG, JPEG และ WebP เท่านั้น", 400);
    }

    const sizeInBytes = Buffer.byteLength(match[2], "base64");
    if (sizeInBytes > 1024 * 1024) {
      throw createError("ไฟล์โลโก้ต้องมีขนาดไม่เกิน 1 MB", 413);
    }
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getSettings()); } catch (err) { next(err); }
}

export async function getPublic(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getPublicSettings()); } catch (err) { next(err); }
}

export async function upsert(req: Request, res: Response, next: NextFunction) {
  try {
    const { key, value } = req.body;
    validateSetting(key, value);
    // Normalize the recipient list so a copy-pasted ID with stray whitespace still pushes.
    const stored = key === "line_user_id" ? parseLineRecipients(value).join(",") : value;
    res.json(await svc.upsertSetting(key, stored));
  } catch (err) { next(err); }
}

export async function lineTest(req: Request, res: Response, next: NextFunction) {
  try {
    const results = await sendLineOrderNotification({
      orderNumber: "TEST-0000",
      totalAmt: 99,
      paymentMethod: "CASH",
      itemCount: 2,
      cashierName: (req.user as { id: number; role: string; displayName?: string })?.displayName ?? "ทดสอบ",
      changeAmt: 1,
      items: [
        { name: "น้ำดื่ม 600 มล.", quantity: 2, unit: "ขวด", subtotal: 14 },
        { name: "ขนมปังไส้สังขยา", quantity: 1, unit: "ชิ้น", subtotal: 85 },
      ],
    });
    const ok = results.every((r) => r.ok);
    // A failed push only ever says "Failed to send messages" — probe for the actual cause.
    const diagnostics = ok ? undefined : await getLineDiagnostics().catch(() => undefined);
    res.json({ ok, results, diagnostics });
  } catch (err) {
    // Surface the real LINE/config error — a bare throw becomes a masked 500.
    const message = err instanceof Error ? err.message : "ส่ง LINE ไม่สำเร็จ";
    const diagnostics = await getLineDiagnostics().catch(() => undefined);
    res.status(502).json({ message, diagnostics });
  }
}

export async function lineDiagnose(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getLineDiagnostics());
  } catch (err) {
    next(createError(err instanceof Error ? err.message : "ตรวจสอบ LINE ไม่สำเร็จ", 502));
  }
}
