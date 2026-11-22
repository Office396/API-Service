import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

// Version 2: revoked keys stay on record (they no longer count toward the key limit).
const schema = `
  CREATE TABLE user (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL, image TEXT, createdAt DATE NOT NULL, updatedAt DATE NOT NULL);
  CREATE TABLE session (id TEXT PRIMARY KEY NOT NULL, expiresAt DATE NOT NULL, token TEXT NOT NULL UNIQUE,
    createdAt DATE NOT NULL, updatedAt DATE NOT NULL, ipAddress TEXT, userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE);
  CREATE INDEX session_userId_idx ON session(userId);
  CREATE TABLE account (id TEXT PRIMARY KEY NOT NULL, accountId TEXT NOT NULL, providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, accessToken TEXT, refreshToken TEXT,
    idToken TEXT, accessTokenExpiresAt DATE, refreshTokenExpiresAt DATE, scope TEXT, password TEXT,
    createdAt DATE NOT NULL, updatedAt DATE NOT NULL);
  CREATE INDEX account_userId_idx ON account(userId);
  CREATE TABLE verification (id TEXT PRIMARY KEY NOT NULL, identifier TEXT NOT NULL, value TEXT NOT NULL,
    expiresAt DATE NOT NULL, createdAt DATE NOT NULL, updatedAt DATE NOT NULL);
  CREATE INDEX verification_identifier_idx ON verification(identifier);
  CREATE TABLE rateLimit (id TEXT PRIMARY KEY NOT NULL, key TEXT NOT NULL UNIQUE, count INTEGER NOT NULL, lastRequest BIGINT NOT NULL);

  CREATE TABLE api_keys (id TEXT PRIMARY KEY NOT NULL, ownerId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    name TEXT NOT NULL, prefix TEXT NOT NULL, hash TEXT NOT NULL UNIQUE, createdAt TEXT NOT NULL,
    lastUsedAt TEXT, revokedAt TEXT, month TEXT NOT NULL, requestsThisMonth INTEGER NOT NULL DEFAULT 0);
  CREATE INDEX api_keys_owner ON api_keys(ownerId);
  CREATE TABLE monthly_usage (ownerId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    month TEXT NOT NULL, used INTEGER NOT NULL CHECK (used >= 0), PRIMARY KEY (ownerId, month));
  PRAGMA user_version = 2;
`;

export function openAccountDb() {
  const dir = process.env.TOOLZYNC_DATA_DIR || path.join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const db = new Database(path.join(dir, "toolzync.sqlite"));
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.transaction(() => {
      const version = db.pragma("user_version", { simple: true });
      if (version === 0) db.exec(schema);
      else if (version === 1) db.exec("ALTER TABLE api_keys ADD COLUMN revokedAt TEXT; PRAGMA user_version = 2;");
      else if (version !== 2) throw new Error("Unsupported account database version.");
    }).immediate();
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

// Keep synchronous metering transactions off the auth adapter's async connection.
let keyDb: Database.Database | undefined;
export function accountDb() {
  return keyDb ??= openAccountDb();
}
