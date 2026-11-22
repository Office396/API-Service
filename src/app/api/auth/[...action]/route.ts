import { accountBody, accountError, accountJson, checkOrigin } from "@/lib/account-http";
import { getAuth } from "@/lib/auth";
import { MAX_PASSWORD_LENGTH, signUpPasswordError } from "@/lib/password-policy";

export async function POST(request: Request, { params }: { params: Promise<{ action: string[] }> }) {
  const action = (await params).action.join("/");
  if (!["sign-up/email", "sign-in/email", "sign-out"].includes(action)) return accountError(404, "not_found", "Unknown account operation.");
  const rejected = checkOrigin(request);
  if (rejected) return rejected;
  const body = await accountBody(request);
  if (body instanceof Response) return body;

  const fields: Record<string, string> = {};
  if (action !== "sign-out") {
    if (typeof body.email !== "string" || body.email.length > 254 || typeof body.password !== "string") {
      return accountError(400, "invalid_input", "Enter a valid email and password.");
    }
    fields.email = body.email.trim().toLowerCase();
    fields.password = body.password;
    if (action === "sign-up/email") {
      const passwordError = signUpPasswordError(body.password);
      if (passwordError) return accountError(400, "invalid_password_length", passwordError);
      if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 80) return accountError(400, "invalid_input", "Enter a name of 1–80 characters.");
      fields.name = body.name.trim();
    } else if (body.password.length > MAX_PASSWORD_LENGTH) {
      return accountError(400, "invalid_input", "Enter a valid email and password.");
    }
  }
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  const result = await getAuth().handler(new Request(request.url, {
    method: "POST", headers, body: JSON.stringify(fields),
  }));
  // Only the HTTP-only cookie crosses the browser boundary; do not echo the session token.
  const response = result.ok ? accountJson(200, { ok: true }) : accountError(result.status, "auth_failed",
    result.status === 429 ? "Too many attempts. Try again later." : action === "sign-in/email" ? "Incorrect email or password." : "Could not complete this request. Check your details or try signing in.");
  for (const cookie of result.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  const retry = result.headers.get("x-retry-after") ?? result.headers.get("retry-after");
  if (retry) response.headers.set("retry-after", retry);
  return response;
}
