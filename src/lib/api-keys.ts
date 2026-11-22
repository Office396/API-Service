import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { accountDb } from "./account-db";

export const FREE_MONTHLY_QUOTA = 1000;
export const BURST_LIMIT = 60;
const KEY_LIMIT = 2;

export type PublicKey = {
  id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null;
  revokedAt: string | null; month: string; requestsThisMonth: number; scopes: string[];
};
type Identity = { id: string; ownerId: string };
export type KeyFailure = { ok: false; code: "invalid_key" | "quota_exceeded" };
type Authorized = { ok: true; key: Identity; remaining: number };
const invalidKey: KeyFailure = { ok: false, code: "invalid_key" };
const exhausted: KeyFailure = { ok: false, code: "quota_exceeded" };
const digest = (raw: string) => createHash("sha256").update(raw).digest("hex");

export function quotaResetAt(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export function accountKeys(ownerId: string) {
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const months = Array.from({ length: 6 }, (_, i) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1)).toISOString().slice(0, 7));
  const db = accountDb();
  return db.transaction(() => {
    const rows = db.prepare<[string, string], Omit<PublicKey, "scopes" | "month">>(`
      SELECT id, name, prefix, createdAt, lastUsedAt, revokedAt,
        CASE WHEN month = ? THEN requestsThisMonth ELSE 0 END AS requestsThisMonth
      FROM api_keys WHERE ownerId = ? ORDER BY (revokedAt IS NOT NULL), createdAt DESC, id`).all(month, ownerId);
    const totals = db.prepare<[string, string, string], { month: string; used: number }>(
      "SELECT month, used FROM monthly_usage WHERE ownerId = ? AND month BETWEEN ? AND ?"
    ).all(ownerId, months[0], month);
    const byMonth = new Map(totals.map(row => [row.month, row.used]));
    return {
      keys: rows.map(row => ({ ...row, month, scopes: ["read", "write"] })),
      usage: { used: byMonth.get(month) ?? 0, limit: FREE_MONTHLY_QUOTA, keyLimit: KEY_LIMIT,
        resetsAt: quotaResetAt(now), asOf: now.toISOString(),
        history: months.map(month => ({ month, used: byMonth.get(month) ?? 0 })) },
    };
  })();
}

export type AccountUsage = ReturnType<typeof accountKeys>["usage"];

export function createApiKey(ownerId: string, name: string) {
  const raw = `tk_live_${randomBytes(24).toString("hex")}`;
  const createdAt = new Date().toISOString();
  const record: PublicKey = { id: `key_${randomBytes(6).toString("hex")}`, name, prefix: raw.slice(0, 14),
    createdAt, lastUsedAt: null, revokedAt: null, month: createdAt.slice(0, 7), requestsThisMonth: 0, scopes: ["read", "write"] };
  // One SQLite write statement: concurrent creations cannot race past the cap. Revoked
  // keys stay on record for auditing, so only live keys count toward the limit.
  const result = accountDb().prepare(`INSERT INTO api_keys (id, ownerId, name, prefix, hash, createdAt, month)
    SELECT ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM api_keys WHERE ownerId = ? AND revokedAt IS NULL) < ?`)
    .run(record.id, ownerId, name, record.prefix, digest(raw), createdAt, record.month, ownerId, KEY_LIMIT);
  return result.changes === 1 ? { key: raw, record } : null;
}

export function revokeApiKey(ownerId: string, id: string) {
  const revokedAt = new Date().toISOString();
  const result = accountDb().prepare("UPDATE api_keys SET revokedAt = ? WHERE ownerId = ? AND id = ? AND revokedAt IS NULL")
    .run(revokedAt, ownerId, id);
  return result.changes === 1 ? revokedAt : null;
}

export function authenticate(raw: string): Authorized | KeyFailure {
  if (!/^tk_live_[a-f0-9]{48}$/.test(raw)) return invalidKey;
  const key = accountDb().prepare<[string, string], Identity & { used: number }>(`
    SELECT k.id, k.ownerId, COALESCE(u.used, 0) AS used FROM api_keys k
    LEFT JOIN monthly_usage u ON u.ownerId = k.ownerId AND u.month = ?
    WHERE k.hash = ? AND k.revokedAt IS NULL`)
    .get(new Date().toISOString().slice(0, 7), digest(raw));
  if (!key) return invalidKey;
  if (key.used >= FREE_MONTHLY_QUOTA) return exhausted;
  return { ok: true, key: { id: key.id, ownerId: key.ownerId }, remaining: FREE_MONTHLY_QUOTA - key.used };
}

// Called after a successful transform. Re-check revocation and atomically claim the
// remaining quota before releasing the result, even when two keys finish concurrently.
export function recordUsage(key: Identity): { ok: true; remaining: number } | KeyFailure {
  const db = accountDb();
  return db.transaction(() => {
    const now = new Date().toISOString();
    const month = now.slice(0, 7);
    if (!db.prepare("SELECT 1 FROM api_keys WHERE ownerId = ? AND id = ? AND revokedAt IS NULL").get(key.ownerId, key.id)) return invalidKey;
    const row = db.prepare<[string, string, number], { used: number }>(`
      INSERT INTO monthly_usage (ownerId, month, used) VALUES (?, ?, 1)
      ON CONFLICT (ownerId, month) DO UPDATE SET used = used + 1 WHERE used < ? RETURNING used`)
      .get(key.ownerId, month, FREE_MONTHLY_QUOTA);
    if (!row) return exhausted;
    db.prepare(`UPDATE api_keys SET requestsThisMonth = CASE WHEN month = ? THEN requestsThisMonth + 1 ELSE 1 END,
      month = ?, lastUsedAt = ? WHERE ownerId = ? AND id = ?`).run(month, month, now, key.ownerId, key.id);
    return { ok: true as const, remaining: FREE_MONTHLY_QUOTA - row.used };
  }).immediate();
}
