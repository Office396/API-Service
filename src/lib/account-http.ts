import "server-only";
import { isAllowedOrigin } from "./auth";

export function accountJson(status: number, payload: unknown) {
  return Response.json(payload, { status, headers: { "cache-control": "private, no-store", vary: "Cookie" } });
}

export function accountError(status: number, code: string, message: string) {
  return accountJson(status, { ok: false, error: { code, message } });
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return isAllowedOrigin(request, origin) ? null
    : accountError(403, "invalid_origin", "This dashboard is open on a different origin. Use the URL printed by the server, or add it to TOOLZYNC_ALLOWED_ORIGINS.");
}

// Cap actual bytes read, including requests without a Content-Length.
export async function accountBody(request: Request): Promise<Record<string, unknown> | Response> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return accountError(415, "unsupported_media_type", "Send application/json.");
  }
  const cap = 8192;
  const tooLarge = () => accountError(413, "payload_too_large", "Request body is too large.");
  if (Number(request.headers.get("content-length")) > cap) return tooLarge();
  const reader = request.body?.getReader();
  try {
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    if (reader) for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > cap) { await reader.cancel(); return tooLarge(); }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch { /* Invalid or incomplete JSON. */ }
  finally { reader?.releaseLock(); }
  return accountError(400, "invalid_json", "Send a JSON object.");
}

