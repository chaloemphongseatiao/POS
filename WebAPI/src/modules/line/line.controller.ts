import { Request, Response, NextFunction } from "express";
import * as svc from "./line.service";
import {
  getLineChannelSecret,
  getLineChannelToken,
  verifyLineSignature,
  fetchLineProfile,
  recordWebhookHit,
  fetchBotInfo,
} from "../../lib/line";
import { createError } from "../../middleware/errorHandler";

interface LineWebhookEvent {
  type: string;
  source?: { type: string; userId?: string };
}

export async function webhook(req: Request, res: Response) {
  const signature = req.headers["x-line-signature"];
  const rawBody = req.body as Buffer;

  const secret = await getLineChannelSecret();
  const signatureOk =
    !!secret &&
    typeof signature === "string" &&
    Buffer.isBuffer(rawBody) &&
    verifyLineSignature(rawBody, signature, secret);

  let payload: { events?: LineWebhookEvent[] } = {};
  try {
    payload = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString("utf-8") : "{}");
  } catch {
    // Leave payload empty — the hit is still worth recording below.
  }

  await recordWebhookHit({
    at: new Date().toISOString(),
    signatureOk,
    events: (payload.events ?? []).map(
      (e) => `${e.type}${e.source?.userId ? ` ${e.source.userId}` : ""}`
    ),
  });

  if (!signatureOk) {
    res.status(401).end();
    return;
  }

  // The work must finish BEFORE responding: on a serverless host the invocation is
  // frozen the moment the response is flushed, so anything left pending is dropped.
  try {
    const token = await getLineChannelToken();
    for (const event of payload.events ?? []) {
      const userId = event.source?.userId;
      if (!userId || event.source?.type !== "user") continue;

      if (event.type === "unfollow") {
        await svc.markUnfollowed(userId);
        continue;
      }

      // Anyone who reaches the bot at all is a usable push target. Registering only on
      // `follow` misses users who added the bot while the webhook was off (Chat mode
      // disables it) — they never emit another follow event, so they'd stay invisible.
      if (event.type === "follow" || (await svc.findFollower(userId)) === null) {
        const profile = token ? await fetchLineProfile(userId, token) : null;
        await svc.upsertFollower(userId, profile?.displayName ?? null);
      }
    }
  } catch (err) {
    // Never answer non-2xx on a verified request — LINE retries, then disables the
    // webhook after repeated failures. Log and move on.
    console.error("[line/webhook] failed to process events", err);
  }

  res.status(200).end();
}

export async function followers(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.listFollowers());
  } catch (err) {
    next(err);
  }
}

export async function syncFollowers(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.syncFollowersFromLine());
  } catch (err) {
    next(err);
  }
}

export async function botInfo(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await fetchBotInfo());
  } catch (err) {
    next(createError(err instanceof Error ? err.message : "อ่านข้อมูลบอทไม่สำเร็จ", 502));
  }
}
