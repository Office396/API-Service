import "server-only";
import { betterAuth } from "better-auth";
import { connection } from "next/server";
import { openAccountDb } from "./account-db";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "./password-policy";

export function authOrigin() {
  const url = new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000");
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(loopback && url.protocol === "http:")) {
    throw new Error("BETTER_AUTH_URL must use HTTPS outside localhost.");
  }
  return url.origin;
}

// The canonical origin plus any explicitly trusted deployment origins. next dev prints a
// Network URL (LAN IP) and 127.0.0.1 resolves to the same server, so requests are also
// accepted when their Origin matches the URL they were actually made to.
export function allowedOrigins() {
  const origins = new Set([authOrigin()]);
  for (const entry of (process.env.TOOLZYNC_ALLOWED_ORIGINS ?? "").split(",")) {
    const value = entry.trim();
    if (!value) continue;
    try { origins.add(new URL(value).origin); }
    catch { throw new Error(`TOOLZYNC_ALLOWED_ORIGINS contains an invalid URL: ${value}`); }
  }
  return origins;
}

// Next reports the configured localhost URL in request.url even when the browser reached
// the dev server over 127.0.0.1 or its LAN address, so the Host header is the only reliable
// source for the address actually used.
export function requestOrigin(request: Request) {
  const fallback = new URL(request.url).origin;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))?.split(",")[0].trim();
  const protocol = (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "")).split(",")[0].trim().toLowerCase();
  if (!host || (protocol !== "http" && protocol !== "https")) return fallback;
  return `${protocol}://${host}`;
}

export function isAllowedOrigin(request: Request | undefined, origin: string | null) {
  if (!origin) return false;
  let parsed: URL;
  try { parsed = new URL(origin); } catch { return false; }
  if (allowedOrigins().has(parsed.origin)) return true;
  // Only in development: the printed 127.0.0.1/LAN URL must work, but production keeps
  // the fixed allowlist so DNS rebinding cannot widen it.
  if (process.env.NODE_ENV === "production" || !request) return false;
  try { return requestOrigin(request) === parsed.origin; } catch { return false; }
}

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Set BETTER_AUTH_SECRET (32+ characters), or run npm run auth:setup locally.");
  const baseURL = authOrigin();
  return betterAuth({
    appName: "Toolzync", baseURL, secret, database: openAccountDb(),
    trustedOrigins: (request) => {
      const origins = [...allowedOrigins()];
      if (request && process.env.NODE_ENV !== "production") {
        const local = requestOrigin(request);
        if (!origins.includes(local)) origins.push(local);
      }
      return origins;
    },
    emailAndPassword: { enabled: true, minPasswordLength: MIN_PASSWORD_LENGTH, maxPasswordLength: MAX_PASSWORD_LENGTH },
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database" },
    advanced: {
      useSecureCookies: baseURL.startsWith("https:"),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
      // An ingress can set and overwrite a trusted client IP header. Otherwise use
      // Better Auth's shared fallback bucket instead of trusting caller-supplied IPs.
      ipAddress: { ipAddressHeaders: process.env.TOOLZYNC_TRUSTED_IP_HEADER ? [process.env.TOOLZYNC_TRUSTED_IP_HEADER] : [] },
    },
    telemetry: { enabled: false },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return instance ??= createAuth(); }

export async function sessionUser(headers: Headers) {
  if (!headers.get("cookie")) return null;
  // A runtime prefetch can see cookies, but checking an expiring session reads
  // the database and the current time. Only do that for an actual request.
  await connection();
  const session = await getAuth().api.getSession({ headers });
  return session ? { id: session.user.id, email: session.user.email } : null;
}
