/** Serializable contract shared by the workbench, example requests and HTTP dispatcher. */
export type ToolBody = Record<string, unknown>;
export type Field = {
  key: string; label: string;
  type: 'text' | 'textarea' | 'integer' | 'number' | 'select' | 'boolean' | 'file' | 'files' | 'password' | 'json';
  required?: boolean; options?: string[]; min?: number; max?: number; accept?: string; help?: string;
  default?: string | number | boolean;
};
export type CatalogSpec = {
  slug: string; summary: string; mode: 'local' | 'server'; fields: Field[]; example: ToolBody;
  /** A mandatory deployment prerequisite, shown to users before they submit. */
  setup?: string;
};
export type ToolFile = { name: string; mime: string; base64: string };
export type RunContext = { ownerId: string; origin: string };
export type ToolResult = Record<string, unknown>;
export class ToolError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly field?: string) { super(message); }
}
export function invalid(message: string, field?: string): never { throw new ToolError(400, 'invalid_input', message, field); }
export function unavailable(message: string): never { throw new ToolError(503, 'tool_unavailable', message); }
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_RESULT_BYTES = 16 * 1024 * 1024;

/** Check shapes before dispatch. Examples are never substituted for missing user input. */
export function validateBody(spec: CatalogSpec, body: ToolBody): ToolBody {
  const out: ToolBody = Object.create(null);
  for (const key of Object.keys(body)) if (!spec.fields.some(f => f.key === key)) invalid(`Unknown field: ${key.slice(0, 64)}.`, key.slice(0, 64));
  let fileBytes = 0;
  function checkFile(value: unknown, key: string) {
    if (typeof value !== 'string' || !value.length || value.length > 4 * Math.ceil(MAX_FILE_BYTES / 3) || value.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(value) || !/^[^=]*={0,2}$/.test(value)) invalid('Send the file as standard padded Base64 (no data URL).', key);
    fileBytes += value.length / 4 * 3 - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0);
    if (fileBytes > MAX_FILE_BYTES) throw new ToolError(413, 'payload_too_large', 'Files may total at most 8 MiB per request.', key);
  }
  for (const f of spec.fields) {
    let value = Object.hasOwn(body, f.key) ? body[f.key] : undefined;
    if (value === undefined) value = f.default;
    if (value === undefined) { if (f.required) invalid(`${f.label} is required.`, f.key); continue; }
    if (f.type === 'file') checkFile(value, f.key);
    else if (f.type === 'files') {
      if (!Array.isArray(value) || value.length < (f.min ?? 1) || value.length > (f.max ?? 8)) invalid(`Provide ${f.min ?? 1}–${f.max ?? 8} files.`, f.key);
      value.forEach(v => checkFile(v, f.key));
    } else if (f.type === 'integer' || f.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value) || (f.type === 'integer' && !Number.isSafeInteger(value)) || value < (f.min ?? -Infinity) || value > (f.max ?? Infinity)) invalid(`Invalid number for ${f.label}.`, f.key);
    } else if (f.type === 'boolean') {
      if (typeof value !== 'boolean') invalid(`${f.label} must be true or false.`, f.key);
    } else if (f.type !== 'json') {
      if (typeof value !== 'string' || (f.required && !value.trim()) || value.length > (f.max ?? 100_000) || value.length < (f.min ?? 0)) invalid(`Invalid text for ${f.label}.`, f.key);
      if (f.type === 'select' && !f.options?.includes(value)) invalid(`Choose one of: ${f.options?.join(', ')}.`, f.key);
    }
    out[f.key] = value;
  }
  return out;
}
