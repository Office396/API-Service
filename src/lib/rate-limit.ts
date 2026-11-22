type Bucket = { windowStart: number; count: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;

export type RateResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export function checkBurst(keyId: string, limit: number): RateResult {
  const now = Date.now();
  const bucket = buckets.get(keyId);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(keyId, { windowStart: now, count: 1 });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

if (typeof setInterval === "function") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [id, bucket] of buckets) {
      if (now - bucket.windowStart >= WINDOW_MS * 5) buckets.delete(id);
    }
  }, WINDOW_MS * 5);
  if (typeof timer === "object" && "unref" in timer) timer.unref();
}
