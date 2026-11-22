const te = new TextEncoder();
const td = new TextDecoder();

function bytesToBinary(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
  return out;
}

export function toBase64(input: string, urlSafe = false): string {
  const b64 = btoa(bytesToBinary(te.encode(input)));
  return urlSafe
    ? b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : b64;
}

export function fromBase64(input: string, urlSafe = false): string {
  let norm = input.replace(/\s+/g, "");
  if (urlSafe || /[-_]/.test(norm)) norm = norm.replace(/-/g, "+").replace(/_/g, "/");
  const padded = norm + "=".repeat((4 - (norm.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return td.decode(bytes);
}

const SUBTLE_ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HashAlgo = (typeof SUBTLE_ALGOS)[number];

export async function hashText(input: string, algo: string = "SHA-256"): Promise<string> {
  const name = algo.toUpperCase().replace("SHA", "SHA-").replace("SHA--", "SHA-");
  if (!SUBTLE_ALGOS.includes(name as HashAlgo)) {
    throw new Error(`Unsupported algorithm: ${algo}. Use ${SUBTLE_ALGOS.join(", ")}.`);
  }
  const digest = await crypto.subtle.digest(name, te.encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function uuidV4(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // getRandomValues is also available on an HTTP LAN preview, unlike randomUUID.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
}

export function slugify(input: string, opts: { separator?: string; lower?: boolean } = {}): string {
  const sep = opts.separator ?? "-";
  const mapped = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[øØ]/g, "o")
    .replace(/[æÆ]/g, "ae")
    .replace(/[ß]/g, "ss")
    .replace(/[đĐ]/g, "d")
    .replace(/[łŁ]/g, "l");
  const lowered = opts.lower === false ? mapped : mapped.toLowerCase();
  return lowered
    .replace(/['’`"]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, sep)
    .replace(new RegExp(`^${escapeRe(sep)}+|${escapeRe(sep)}+$`, "g"), "")
    .replace(new RegExp(`${escapeRe(sep)}{2,}`, "g"), sep);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type CaseMode =
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "title"
  | "sentence"
  | "upper"
  | "lower"
  | "dot";

export function convertCase(input: string, mode: CaseMode): string {
  const words = input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-./]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
  if (!words.length) return "";
  switch (mode) {
    case "camel":
      return words[0] + words.slice(1).map(cap).join("");
    case "pascal":
      return words.map(cap).join("");
    case "snake":
      return words.join("_");
    case "kebab":
      return words.join("-");
    case "constant":
      return words.join("_").toUpperCase();
    case "dot":
      return words.join(".");
    case "title":
      return words.map(cap).join(" ");
    case "sentence":
      return cap(words.join(" "));
    case "upper":
      return input.toUpperCase();
    case "lower":
      return input.toLowerCase();
    default:
      return input;
  }
}

function cap(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function formatJson(
  input: string,
  mode: "pretty" | "minify" | "sort" = "pretty",
): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    throw new Error(message);
  }
  if (mode === "minify") return JSON.stringify(parsed);
  if (mode === "sort") return JSON.stringify(sortKeys(parsed), null, 2);
  return JSON.stringify(parsed, null, 2);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
}

export type JwtParts = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  expired: boolean | null;
  expiresAt: string | null;
  issuedAt: string | null;
};

export function decodeJwt(token: string, now: number | null = Date.now()): JwtParts {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("A JWT needs at least a header and a payload.");
  const header = JSON.parse(fromBase64(parts[0], true)) as Record<string, unknown>;
  const payload = JSON.parse(fromBase64(parts[1], true)) as Record<string, unknown>;
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const iat = typeof payload.iat === "number" ? payload.iat : null;
  return {
    header,
    payload,
    signature: parts[2] ?? "",
    expired: exp === null || now === null ? null : exp * 1000 < now,
    expiresAt: exp === null ? null : new Date(exp * 1000).toISOString(),
    issuedAt: iat === null ? null : new Date(iat * 1000).toISOString(),
  };
}

export type TextStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  topKeywords: { word: string; count: number }[];
};

const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have how i if in into is it its of on or that the their then there these they this to was were what when where which who will with your you our we".split(
    " ",
  ),
);

export function countText(input: string): TextStats {
  const words = input.match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) ?? [];
  const sentences = input.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0).length;
  const paragraphs = input.split(/\n{2,}/).filter((p) => p.trim().length > 0).length;
  const freq = new Map<string, number>();
  for (const raw of words) {
    const w = raw.toLowerCase();
    if (w.length < 3 || STOP_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return {
    words: words.length,
    characters: [...input].length,
    charactersNoSpaces: [...input.replace(/\s/g, "")].length,
    sentences,
    paragraphs,
    lines: input ? input.split("\n").length : 0,
    readingTimeMinutes: Math.max(1, Math.round(words.length / 220)) || 0,
    speakingTimeMinutes: Math.max(1, Math.round(words.length / 130)) || 0,
    topKeywords: [...freq.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([word, count]) => ({ word, count })),
  };
}

const LOREM = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
  " ",
);

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function lorem(
  count: number,
  unit: "paragraphs" | "sentences" | "words",
  seed = 7,
): string {
  const rand = mulberry32(seed);
  const pick = () => LOREM[Math.floor(rand() * LOREM.length)];
  const sentence = () => {
    const len = 8 + Math.floor(rand() * 10);
    const words = Array.from({ length: len }, pick);
    return cap(words.join(" ")) + ".";
  };
  const paragraph = () =>
    Array.from({ length: 3 + Math.floor(rand() * 3) }, sentence).join(" ");

  const n = Math.min(Math.max(1, Math.floor(count) || 1), unit === "words" ? 500 : 20);
  if (unit === "words") return Array.from({ length: n }, pick).join(" ") + ".";
  if (unit === "sentences") return Array.from({ length: n }, sentence).join(" ");
  return Array.from({ length: n }, paragraph).join("\n\n");
}

export type PasswordOptions = {
  length?: number;
  upper?: boolean;
  lower?: boolean;
  digits?: boolean;
  symbols?: boolean;
  passphrase?: boolean;
  words?: number;
};

const PASSPHRASE_WORDS = "amber anchor atlas beacon birch canyon cedar cobalt comet coral delta ember falcon ferro flint garnet granite harbor indigo ivory jasper kestrel lantern marble meadow nimbus onyx opal orbit pebble quartz quiver raven ridge saffron sapphire sierra slate solstice summit talon tundra umber velvet vertex willow zephyr".split(
  " ",
);

function randomInt(max: number) {
  if (max <= 0) return 0;
  return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}

export function generatePassword(opts: PasswordOptions = {}): string {
  if (opts.passphrase) {
    const words = Math.min(Math.max(opts.words ?? 4, 3), 8);
    const picked = Array.from({ length: words }, () => {
      const w = PASSPHRASE_WORDS[randomInt(PASSPHRASE_WORDS.length)];
      return Math.random() < 0.5 ? w : cap(w);
    });
    return picked.join("-") + "-" + randomInt(100).toString().padStart(2, "0");
  }
  const sets: string[] = [];
  if (opts.lower !== false) sets.push("abcdefghijkmnopqrstuvwxyz");
  if (opts.upper !== false) sets.push("ABCDEFGHJKLMNPQRSTUVWXYZ");
  if (opts.digits !== false) sets.push("23456789");
  if (opts.symbols !== false) sets.push("!@#$%^&*()-_=+[]{};:,.?");
  const alphabet = sets.join("");
  const length = Math.min(Math.max(opts.length ?? 20, 8), 128);
  const chars = Array.from({ length }, () => alphabet[randomInt(alphabet.length)]);
  sets.forEach((set, i) => {
    chars[i] = set[randomInt(set.length)];
  });
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export type Swatch = { name: string; hex: string; rgb: string; hsl: string; contrastOnWhite: number; contrastOnBlack: number };

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error("Expected a 3 or 6 digit hex colour.");
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = ln - c / 2;
  return (
    "#" +
    [r1, g1, b1]
      .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

function luminance(r: number, g: number, b: number): number {
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function ratio(l1: number, l2: number) {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
}

export function palette(hex: string): { base: Swatch; shades: Swatch[] } {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const stops: { name: string; l: number }[] = [
    { name: "50", l: 96 },
    { name: "100", l: 92 },
    { name: "200", l: 84 },
    { name: "300", l: 74 },
    { name: "400", l: 64 },
    { name: "500", l: Math.min(56, Math.max(44, l)) },
    { name: "600", l: 40 },
    { name: "700", l: 32 },
    { name: "800", l: 24 },
    { name: "900", l: 16 },
    { name: "950", l: 10 },
  ];
  const toSwatch = (name: string, value: string): Swatch => {
    const [rr, gg, bb] = hexToRgb(value);
    const [hh, ss, ll] = rgbToHsl(rr, gg, bb);
    const lum = luminance(rr, gg, bb);
    return {
      name,
      hex: value,
      rgb: `rgb(${rr}, ${gg}, ${bb})`,
      hsl: `hsl(${hh}, ${ss}%, ${ll}%)`,
      contrastOnWhite: ratio(lum, 1),
      contrastOnBlack: ratio(lum, 0),
    };
  };
  return {
    base: toSwatch("base", hslToHex(h, s, l)),
    shades: stops.map((stop) => toSwatch(stop.name, hslToHex(h, Math.max(0, s - (stop.l > 70 ? 10 : 0)), stop.l))),
  };
}

export type CronResult = {
  description: string;
  fields: string[];
  nextRuns: string[];
  valid: boolean;
};

const CRON_MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");
const CRON_DAYS = "SUN MON TUE WED THU FRI SAT".split(" ");

function parseCronField(field: string, min: number, max: number, names?: string[]): number[] | null {
  const values = new Set<number>();
  for (const part of field.split(",")) {
    let step = 1;
    let range = part;
    if (part.includes("/")) {
      const [r, s] = part.split("/");
      range = r;
      step = Number(s);
      if (!Number.isFinite(step) || step <= 0) return null;
    }
    let start: number;
    let end: number;
    if (range === "*") {
      start = min;
      end = max;
    } else if (range.includes("-")) {
      const [a, b] = range.split("-");
      start = resolveCronValue(a, names);
      end = resolveCronValue(b, names);
    } else {
      start = resolveCronValue(range, names);
      end = start;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    // Day-of-week 7 is Sunday
    if (max === 6) {
      if (start === 7) start = 0;
      if (end === 7) end = 0;
    }
    if (start < min || end > max || start > end) return null;
    for (let v = start; v <= end; v += step) values.add(v);
  }
  return values.size ? [...values].sort((a, b) => a - b) : null;
}

function resolveCronValue(token: string, names?: string[]): number {
  const upper = token.toUpperCase();
  if (names && names.includes(upper)) return names.indexOf(upper);
  return Number(token);
}

export function parseCron(expression: string, from: Date | null = new Date()): CronResult {
  const fields = expression.trim().split(/\s+/);
  const empty: CronResult = { description: "Enter a five-field cron expression.", fields, nextRuns: [], valid: false };
  if (fields.length !== 5) {
    return { ...empty, description: `Expected 5 fields, received ${fields.length}.` };
  }
  const minute = parseCronField(fields[0], 0, 59);
  const hour = parseCronField(fields[1], 0, 23);
  const dom = parseCronField(fields[2], 1, 31);
  const month = parseCronField(fields[3], 1, 12, CRON_MONTHS);
  const dow = parseCronField(fields[4], 0, 6, CRON_DAYS);
  if (!minute || !hour || !dom || !month || !dow) {
    return { ...empty, description: "One or more fields are out of range." };
  }

  const domRestricted = fields[2] !== "*";
  const dowRestricted = fields[4] !== "*";
  const matches = (date: Date) => {
    if (!minute.includes(date.getMinutes())) return false;
    if (!hour.includes(date.getHours())) return false;
    if (!month.includes(date.getMonth() + 1)) return false;
    const domOk = dom.includes(date.getDate());
    const dowOk = dow.includes(date.getDay());
    if (domRestricted && dowRestricted) return domOk || dowOk;
    if (domRestricted) return domOk;
    if (dowRestricted) return dowOk;
    return true;
  };

  const nextRuns: string[] = [];
  if (from) {
    const cursor = new Date(from.getTime());
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
    const limit = 60 * 24 * 400;
    for (let i = 0; i < limit && nextRuns.length < 5; i += 1) {
      if (matches(cursor)) nextRuns.push(cursor.toISOString());
      cursor.setMinutes(cursor.getMinutes() + 1);
    }
  }

  return { description: describeCron(fields, minute, hour, dom, month, dow), fields, nextRuns, valid: true };
}

function describeCron(fields: string[], minute: number[], hour: number[], dom: number[], month: number[], dow: number[]): string {
  const time =
    fields[0].startsWith("*/") && fields[1] === "*"
      ? `Every ${fields[0].slice(2)} minutes`
      : hour.length === 1 && minute.length === 1
        ? `At ${String(hour[0]).padStart(2, "0")}:${String(minute[0]).padStart(2, "0")}`
        : hour.length <= 3 && minute.length === 1
          ? `At minute ${minute[0]} past hours ${hour.join(", ")}`
          : `At minutes ${minute.slice(0, 6).join(", ")} past hours ${hour.slice(0, 5).join(", ")}`;

  const days =
    fields[2] === "*" && fields[4] === "*"
      ? "every day"
      : fields[4] !== "*"
        ? `on ${dow.map((d) => CRON_DAYS[d]).join(", ")}`
        : `on day${dom.length > 1 ? "s" : ""} ${dom.slice(0, 8).join(", ")} of the month`;

  const months = fields[3] === "*" ? "" : ` in ${month.map((m) => CRON_MONTHS[m - 1]).join(", ")}`;
  return `${time} ${days}${months}.`;
}

export type UtmParams = {
  url: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export function buildUtm(params: UtmParams): string {
  let url: URL;
  try {
    url = new URL(params.url.trim());
  } catch {
    throw new Error("URL must include a protocol, e.g. https://example.com/page");
  }
  const keys = ["source", "medium", "campaign", "term", "content"] as const;
  for (const key of keys) {
    const value = params[key];
    url.searchParams.delete(`utm_${key}`);
    if (value && value.trim()) url.searchParams.set(`utm_${key}`, value.trim());
  }
  return url.toString();
}

export type RobotsRule = { agent: string; allow: string[]; disallow: string[] };

export function buildRobots(rules: RobotsRule[], sitemap?: string): string {
  const lines: string[] = [];
  for (const rule of rules) {
    lines.push(`User-agent: ${rule.agent || "*"}`);
    rule.disallow.filter(Boolean).forEach((p) => lines.push(`Disallow: ${p}`));
    rule.allow.filter(Boolean).forEach((p) => lines.push(`Allow: ${p}`));
    lines.push("");
  }
  if (sitemap && sitemap.trim()) lines.push(`Sitemap: ${sitemap.trim()}`);
  return lines.join("\n").trim() + "\n";
}

const DISPOSABLE = new Set(
  "mailinator.com tempmail.com guerrillamail.com 10minutemail.com throwawaymail.com yopmail.com sharklasers.com dispostable.com trashmail.com getnada.com".split(
    " ",
  ),
);

const TYPO_DOMAINS: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmial.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "yahho.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "icloud.con": "icloud.com",
};

export type EmailCheck = {
  email: string;
  valid: boolean;
  local: string | null;
  domain: string | null;
  disposable: boolean;
  freeProvider: boolean;
  suggestion: string | null;
  reasons: string[];
};

export function validateEmail(email: string): EmailCheck {
  const value = email.trim();
  const reasons: string[] = [];
  const match = /^([^\s@]+)@([^\s@]+\.[^\s@]{2,})$/.exec(value);
  if (!match) {
    return {
      email: value,
      valid: false,
      local: null,
      domain: null,
      disposable: false,
      freeProvider: false,
      suggestion: null,
      reasons: ["Missing @ or a valid domain with a dot."],
    };
  }
  const [, local, domain] = match;
  if (local.length > 64) reasons.push("Local part is longer than 64 characters.");
  if (value.length > 254) reasons.push("Address is longer than 254 characters.");
  if (/\.\./.test(local)) reasons.push("Local part contains consecutive dots.");
  if (/^\.|\.$/.test(local)) reasons.push("Local part starts or ends with a dot.");
  const lowerDomain = domain.toLowerCase();
  const suggestion = TYPO_DOMAINS[lowerDomain] ? `${local}@${TYPO_DOMAINS[lowerDomain]}` : null;
  const freeProvider = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me", "aol.com"].includes(lowerDomain);
  return {
    email: value,
    valid: reasons.length === 0,
    local,
    domain: lowerDomain,
    disposable: DISPOSABLE.has(lowerDomain),
    freeProvider,
    suggestion,
    reasons,
  };
}

export function jsonToCsv(input: string, protectCells = false): { csv: string; rows: number; columns: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Invalid JSON");
  }
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (!rows.every((r) => r && typeof r === "object" && !Array.isArray(r))) {
    throw new Error("Expected an object or an array of objects.");
  }
  const flat = rows.map((row) => flatten(row as Record<string, unknown>));
  const columns = [...new Set(flat.flatMap((r) => Object.keys(r)))];
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
    const s = protectCells && typeof value === "string" && /^([\t\r\n]|\s*[=+@-])/.test(raw) ? `'${raw}` : raw;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    columns.map(escape).join(","),
    ...flat.map((row) => columns.map((c) => escape(row[c])).join(",")),
  ].join("\n");
  return { csv, rows: flat.length, columns };
}

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length <= 24) {
      Object.assign(out, flatten(value as Record<string, unknown>, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

export function estimateEntropy(password: string): number {
  const pools = [
    /[a-z]/.test(password) ? 26 : 0,
    /[A-Z]/.test(password) ? 26 : 0,
    /[0-9]/.test(password) ? 10 : 0,
    /[^a-zA-Z0-9]/.test(password) ? 33 : 0,
  ].reduce((a, b) => a + b, 0);
  return Math.round(password.length * Math.log2(Math.max(pools, 1)));
}
