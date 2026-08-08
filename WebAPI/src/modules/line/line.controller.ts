import { Request, Response, NextFunction } from "express";
import * as svc from "./line.service";
import { getLineChannelSecret, getLineChannelToken, verifyLineSignature, fetchLineProfile } from "../../lib/line";

interface LineWebhookEvent {
  type: string;
  source?: { type: string; userId?: string };
}

export async function webhook(req: Request, res: Response) {
  const signature = req.headers["x-line-signature"];
  const rawBody = req.body as Buffer;

  const secret = await getLineChannelSecret();
  if (!secret || typeof signature !== "string" || !Buffer.isBuffer(rawBody) || !verifyLineSignature(rawBody, signature, secret)) {
    res.status(401).end();
    return;
  }

  let payload: { events?: LineWebhookEvent[] };
  try {
    payload = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    res.status(400).end();
    return;
  }

  res.status(200).end();

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
}

export async function followers(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await svc.listFollowers());
  } catch (err) {
    next(err);
  }
}
