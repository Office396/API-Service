import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import * as E from "@/lib/engines";
import { buildMetaTags } from "@/lib/meta-tags";
import { getTool, type ToolKind } from "@/lib/tools";
import {
  authenticate,
  recordUsage,
  quotaResetAt,
  BURST_LIMIT,
  FREE_MONTHLY_QUOTA,
  type KeyFailure,
} from "@/lib/api-keys";
import { checkBurst } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 256 * 1024;
const API_VERSION = "v1";
const QUICKSTART_ALIASES = new Map([
  ["hash", "hash-generator"],
  ["slug", "slug-generator"],
  ["uuid", "uuid-generator"],
]);

class ApiError extends Error {
  status: number;
  code: string;
  field?: string;
  constructor(status: number, code: string, message: string, field?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

type Body = Record<string, unknown>;
type Handler = (body: Body) => unknown | Promise<unknown>;

function str(body: Body, key: string, fallback = ""): string {
  const value = body[key];
  return typeof value === "string" ? value : fallback;
}

function input(body: Body): string {
  const value = body.input;
  if (typeof value !== "string" || value.length === 0) {
    throw new ApiError(400, "invalid_input", "`input` is required and must be a non-empty string.", "input");
  }
  if (value.length > 200_000) {
    throw new ApiError(400, "invalid_input", "`input` exceeds 200,000 characters.", "input");
  }
  return value;
}

function boolean(body: Body, key: string, fallback: boolean): boolean {
  const value = body[key];
  return typeof value === "boolean" ? value : fallback;
}

function number(body: Body, key: string, fallback: number): number {
  const value = body[key];
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function assert(condition: unknown, message: string, field?: string): asserts condition {
  if (!condition) throw new ApiError(400, "invalid_input", message, field);
}

const CASE_MODES = ["camel", "pascal", "snake", "kebab", "constant", "title", "sentence", "upper", "lower", "dot"] as const;

const handlers: Record<ToolKind, Handler> = {
  base64: (body) => {
    const mode = str(body, "mode", "encode") === "decode" ? "decode" : "encode";
    const urlSafe = boolean(body, "urlSafe", false);
    return mode === "decode"
      ? { result: E.fromBase64(input(body), urlSafe), mode }
      : { result: E.toBase64(input(body), urlSafe), mode };
  },
  hash: async (body) => {
    const algorithm = str(body, "algorithm", "sha256").toLowerCase();
    const hash = await E.hashText(input(body), algorithm);
    return { hash, algorithm: algorithm.replace(/[^a-z0-9]/g, "") };
  },
  uuid: (body) => {
    const count = Math.min(100, Math.max(1, Math.floor(number(body, "count", 1))));
    return { uuids: Array.from({ length: count }, () => E.uuidV4()), count };
  },
  slug: (body) => {
    const separator = str(body, "separator", "-");
    assert(separator.length === 1, "`separator` must be a single character.", "separator");
    return { slug: E.slugify(input(body), { separator, lower: boolean(body, "lower", true) }) };
  },
  case: (body) => {
    const mode = str(body, "mode", "camel") as E.CaseMode;
    assert(CASE_MODES.includes(mode), `\`mode\` must be one of: ${CASE_MODES.join(", ")}.`, "mode");
    return { result: E.convertCase(input(body), mode), mode };
  },
  json: (body) => {
    const mode = str(body, "mode", "pretty");
    assert(["pretty", "minify", "sort"].includes(mode), "`mode` must be pretty, minify or sort.", "mode");
    const result = E.formatJson(input(body), mode as "pretty" | "minify" | "sort");
    return { result, bytes: result.length, mode };
  },
  jwt: (body) => E.decodeJwt(input(body)),
  wordcount: (body) => E.countText(input(body)),
  lorem: (body) => {
    const unit = str(body, "unit", "paragraphs");
    assert(["paragraphs", "sentences", "words"].includes(unit), "`unit` must be paragraphs, sentences or words.", "unit");
    const text = E.lorem(Math.floor(number(body, "count", 3)), unit as "paragraphs" | "sentences" | "words", Math.floor(number(body, "seed", 7)));
    return { text, unit };
  },
  password: (body) => {
    const password = E.generatePassword({
      length: Math.floor(number(body, "length", 20)),
      upper: boolean(body, "upper", true),
      lower: boolean(body, "lower", true),
      digits: boolean(body, "digits", true),
      symbols: boolean(body, "symbols", true),
      passphrase: boolean(body, "passphrase", false),
      words: Math.floor(number(body, "words", 4)),
    });
    return { password, entropyBits: Math.round(E.estimateEntropy(password)) };
  },
  color: (body) => {
    const hex = str(body, "hex") || str(body, "input");
    assert(/^#?[0-9a-fA-F]{6}$/.test(hex.trim()), "`hex` must be a 6-digit hex colour such as #ccf75a.", "hex");
    return E.palette(hex.trim());
  },
  cron: (body) => E.parseCron(str(body, "expression") || input(body)),
  utm: (body) => {
    const url = str(body, "url") || input(body);
    return {
      url: E.buildUtm({
        url,
        source: str(body, "source"),
        medium: str(body, "medium"),
        campaign: str(body, "campaign"),
        term: str(body, "term"),
        content: str(body, "content"),
      }),
    };
  },
  robots: (body) => {
    const rules = body.rules;
    assert(Array.isArray(rules) && rules.length > 0, "`rules` must be a non-empty array.", "rules");
    const normalized = rules.slice(0, 20).map((rule, index) => {
      const r = (rule ?? {}) as Body;
      const allow = Array.isArray(r.allow) ? r.allow.map(String) : [];
      const disallow = Array.isArray(r.disallow) ? r.disallow.map(String) : [];
      assert(allow.length + disallow.length <= 50, `rules[${index}] has too many paths.`, "rules");
      return { agent: str(r, "agent", "*"), allow, disallow };
    });
    return { robots: E.buildRobots(normalized, str(body, "sitemap")) };
  },
  email: (body) => E.validateEmail(str(body, "email") || input(body)),
  csv: (body) => E.jsonToCsv(input(body), boolean(body, "protectCells", false)),
  meta: (body) => {
    assert(body.image === undefined || typeof body.image === "string", "`image` must be a URL string.", "image");
    const result = buildMetaTags({ title: str(body, "title"), description: str(body, "description"), url: str(body, "url"), image: str(body, "image") });
    if (!result.ok) throw new ApiError(400, "invalid_input", result.message, result.field);
    return result.data;
  },
};

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Authorization, Content-Type, x-api-key, Idempotency-Key",
    "access-control-expose-headers": "x-request-id, x-ratelimit-limit, x-ratelimit-remaining, x-quota-limit, x-quota-remaining, x-quota-reset",
  };
}

function respond(
  status: number,
  payload: unknown,
  requestId: string,
  extra: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      ...corsHeaders(),
      "x-request-id": requestId,
      "cache-control": "no-store",
      ...extra,
    },
  });
}

function bodyFromSearch(search: URLSearchParams): Body {
  const body: Body = {};
  for (const [key, value] of search.entries()) {
    if (key in body) continue;
    body[key] = value;
  }
  return body;
}

async function readBody(request: Request, search: URLSearchParams): Promise<Body> {
  if (request.method === "GET") return bodyFromSearch(search);

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) {
    throw new ApiError(413, "payload_too_large", "Request body exceeds 256 KB.");
  }

  const text = await request.text();
  if (!text.trim()) return {};
  if (text.length > MAX_BODY_BYTES) {
    throw new ApiError(413, "payload_too_large", "Request body exceeds 256 KB.");
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    assert(parsed && typeof parsed === "object" && !Array.isArray(parsed), "Body must be a JSON object.", "body");
    return parsed as Body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "invalid_json", "Body is not valid JSON.");
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function keyError(failure: KeyFailure, requestId: string) {
  const limited = failure.code === "quota_exceeded";
  const reset = quotaResetAt();
  const headers: Record<string, string> = limited ? {
    "x-quota-limit": String(FREE_MONTHLY_QUOTA), "x-quota-remaining": "0", "x-quota-reset": reset,
    "retry-after": String(Math.max(1, Math.ceil((Date.parse(reset) - Date.now()) / 1000))),
  } : { "www-authenticate": 'Bearer realm="toolzync"' };
  return respond(limited ? 429 : 401, { ok: false,
    error: { code: failure.code, message: limited ? "The account's monthly request quota is exhausted." : "Unknown or revoked API key." },
    meta: { request_id: requestId, version: API_VERSION },
  }, requestId, headers);
}

function storageError(id: string) {
  return respond(500, { ok: false, error: { code: "internal_error", message: "Could not access the account store." },
    meta: { request_id: id, version: API_VERSION } }, id);
}

async function dispatch(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const started = Date.now();
  const requestId = `req_${randomBytes(5).toString("hex")}`;
  const { path } = await context.params;
  const slug = (path?.[0] ?? "").toLowerCase().replace(/\.json$/, "");

  if (!slug || slug.includes("/")) {
    return respond(404, {
      ok: false,
      error: { code: "unknown_tool", message: "Use /v1/<tool-slug>." },
      meta: { request_id: requestId, version: API_VERSION },
    }, requestId);
  }

  const tool = getTool(QUICKSTART_ALIASES.get(slug) ?? slug);
  if (!tool) {
    return respond(404, {
      ok: false,
      error: { code: "unknown_tool", message: `No tool with slug "${slug}". See /docs/api.`, docs_url: "/docs/api" },
      meta: { request_id: requestId, version: API_VERSION },
    }, requestId);
  }

  const headerKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const rawKey = headerKey || request.headers.get("x-api-key")?.trim() || "";
  if (!rawKey) {
    return respond(401, {
      ok: false,
      error: { code: "invalid_key", message: "Send `Authorization: Bearer <key>` or `x-api-key`." },
      meta: { request_id: requestId, version: API_VERSION },
    }, requestId, { "www-authenticate": 'Bearer realm="toolzync"' });
  }

  let auth: ReturnType<typeof authenticate>;
  try { auth = authenticate(rawKey); } catch { return storageError(requestId); }
  if (!auth.ok) return keyError(auth, requestId);

  const burst = checkBurst(auth.key.id, BURST_LIMIT);
  const baseHeaders: Record<string, string> = {
    "x-ratelimit-limit": String(BURST_LIMIT),
    "x-ratelimit-remaining": String(burst.remaining),
    "x-quota-limit": String(FREE_MONTHLY_QUOTA),
    "x-quota-remaining": String(auth.remaining),
    "x-quota-reset": quotaResetAt(),
  };

  if (!burst.allowed) {
    return respond(429, {
      ok: false,
      error: { code: "rate_limited", message: `Burst limit is ${BURST_LIMIT} requests per minute.` },
      meta: { request_id: requestId, version: API_VERSION, tool: tool.slug },
    }, requestId, { ...baseHeaders, "retry-after": String(burst.retryAfterSeconds) });
  }

  if (!tool.live || !tool.kind) {
    return respond(409, {
      ok: false,
      error: { code: "tool_not_live", message: `${tool.name} is on the roadmap and not served yet.`, docs_url: "/contact-sales" },
      meta: { request_id: requestId, version: API_VERSION, tool: tool.slug },
    }, requestId, baseHeaders);
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return respond(405, {
      ok: false,
      error: { code: "method_not_allowed", message: "Use GET or POST." },
      meta: { request_id: requestId, version: API_VERSION, tool: tool.slug },
    }, requestId, { ...baseHeaders, allow: "GET, POST, OPTIONS" });
  }

  try {
    const url = new URL(request.url);
    const body = await readBody(request, url.searchParams);
    const handler = handlers[tool.kind];
    const data = await handler(body);
    let usage: ReturnType<typeof recordUsage>;
    try { usage = recordUsage(auth.key); } catch { return storageError(requestId); }
    if (!usage.ok) return keyError(usage, requestId);

    return respond(200, {
      ok: true,
      data,
      meta: {
        tool: tool.slug,
        name: tool.name,
        version: API_VERSION,
        request_id: requestId,
        latency_ms: Date.now() - started,
      },
    }, requestId, { ...baseHeaders, "x-quota-remaining": String(usage.remaining) });
  } catch (error) {
    if (error instanceof ApiError) {
      return respond(error.status, {
        ok: false,
        error: { code: error.code, message: error.message, ...(error.field ? { field: error.field } : {}) },
        meta: { request_id: requestId, version: API_VERSION, tool: tool.slug },
      }, requestId, baseHeaders);
    }
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return respond(422, {
      ok: false,
      error: { code: "unprocessable_input", message },
      meta: { request_id: requestId, version: API_VERSION, tool: tool.slug },
    }, requestId, baseHeaders);
  }
}

export const GET = dispatch;
export const POST = dispatch;
