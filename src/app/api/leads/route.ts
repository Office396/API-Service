import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = process.env.TOOLZYNC_DATA_DIR || path.join(process.cwd(), ".data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status, headers: { "cache-control": "no-store" } });
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 16 * 1024) {
    return json(413, { ok: false, error: { code: "payload_too_large", message: "Message is too long." } });
  }

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) return json(400, { ok: false, error: { code: "invalid_input", message: "Send a JSON object." } });
    body = value as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, error: { code: "invalid_json", message: "Body is not valid JSON." } });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 254).toLowerCase();
  const company = clean(body.company, 160);
  const volume = clean(body.volume, 32);
  const message = clean(body.message, 4000);

  if (name.length < 2) {
    return json(400, { ok: false, error: { code: "invalid_input", message: "Tell us your name.", field: "name" } });
  }
  if (!EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: { code: "invalid_input", message: "That email does not look right.", field: "email" } });
  }
  if (message.length < 12) {
    return json(400, { ok: false, error: { code: "invalid_input", message: "Add a sentence about what you are building.", field: "message" } });
  }

  const lead = {
    id: `lead_${Date.now().toString(36)}`,
    receivedAt: new Date().toISOString(),
    name,
    email,
    company,
    volume,
    topic: clean(body.topic, 120),
    message,
  };

  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(LEADS_FILE, `${JSON.stringify(lead)}\n`, "utf8");
  } catch {
    return json(500, {
      ok: false,
      error: { code: "storage_unavailable", message: "Could not store the request. Email sales@toolzync.com." },
    });
  }

  return json(201, { ok: true, data: { id: lead.id } });
}
