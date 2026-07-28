import { Request, Response, NextFunction } from "express";
import * as svc from "./settings.service";
import { sendLineOrderNotification } from "../../lib/line";
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
    res.json(await svc.upsertSetting(key, value));
  } catch (err) { next(err); }
}

export async function lineTest(req: Request, res: Response, next: NextFunction) {
  try {
    await sendLineOrderNotification({
      orderNumber: "TEST-0000",
      totalAmt: 99,
      paymentMethod: "CASH",
      itemCount: 1,
      cashierName: (req.user as { id: number; role: string; displayName?: string })?.displayName ?? "ทดสอบ",
      changeAmt: 1,
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
