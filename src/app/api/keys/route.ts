import { accountKeys, createApiKey, revokeApiKey } from "@/lib/api-keys";
import { sessionUser } from "@/lib/auth";
import { accountBody, accountError, accountJson, checkOrigin } from "@/lib/account-http";

async function manageKeys(request: Request) {
  const user = await sessionUser(request.headers);
  if (!user) return accountError(401, "unauthenticated", "Sign in to manage your keys.");
  if (request.method === "GET") {
    const { keys, usage } = accountKeys(user.id);
    return accountJson(200, { ok: true, data: keys, meta: { usage } });
  }
  const denied = checkOrigin(request);
  if (denied) return denied;
  if (request.method === "DELETE") {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^key_[a-f0-9]{12}$/.test(id)) return accountError(400, "invalid_input", "Provide a valid key ID.");
    const revokedAt = revokeApiKey(user.id, id);
    return revokedAt ? accountJson(200, { ok: true, data: { id, revokedAt } })
      : accountError(404, "not_found", "Key not found.");
  }
  const body = await accountBody(request);
  if (body instanceof Response) return body;
  if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length > 60)) {
    return accountError(400, "invalid_input", "Key names must be at most 60 characters.");
  }
  const key = createApiKey(user.id, body.name?.trim() || "Untitled key");
  return key ? accountJson(201, { ok: true, data: key }) : accountError(409, "key_limit", "Free tier allows 2 keys. Revoke one first.");
}

export const GET = manageKeys;
export const POST = manageKeys;
export const DELETE = manageKeys;
