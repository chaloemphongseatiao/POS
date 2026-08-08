import { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-process fixed-window limiter. It is intentionally dependency-free and
 * therefore per-instance: behind several API instances the effective limit is
 * multiplied. That is still enough to turn unlimited password guessing into a
 * slow trickle, which is the point.
 */
function createRateLimit(options: {
  windowMs: number;
  max: number;
  message: string;
  key: (req: Request) => string;
}) {
  const buckets = new Map<string, Bucket>();

  function sweep(now: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    // Cheap amortised cleanup so the map can't grow unbounded.
    if (buckets.size > 1000) sweep(now);

    const key = options.key(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      res.status(429).json({ message: options.message });
      return;
    }

    next();
  };
}

export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
  // Bucketed per account as well as per address so one cashier locking
  // themselves out doesn't block the register next to them.
  key: (req) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "";
    return `${req.ip ?? "unknown"}|${username}`;
  },
});
