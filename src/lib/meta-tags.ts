export type MetaFields = { title: string; description: string; url: string; image: string };

export const metaExample: MetaFields = {
  title: "Field notes from the studio",
  description: "A collection of sketches, experiments, and small discoveries from our design team.",
  url: "https://example.com/field-notes",
  image: "",
};

const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (s: string) => s.replace(/[&<>"']/g, char => entities[char]);

function webUrl(value: string) {
  if (value.length > 2048 || !/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    return url.hostname && !url.username && !url.password ? url : null;
  } catch { return null; }
}

type MetaResult = { ok: false; field: keyof MetaFields; message: string }
  | { ok: true; data: { html: string; host: string; card: "summary" | "summary_large_image" } };

// Pure text transformation: neither the preview nor the API fetches either URL.
export function buildMetaTags(fields: MetaFields): MetaResult {
  const title = fields.title.trim(), description = fields.description.trim();
  if (!title || title.length > 200) return { ok: false, field: "title", message: "Enter a page title of 1–200 characters." };
  if (!description || description.length > 500) return { ok: false, field: "description", message: "Enter a description of 1–500 characters." };
  const url = webUrl(fields.url.trim());
  if (!url) return { ok: false, field: "url", message: "Enter a full HTTP or HTTPS page URL without login details." };
  const image = fields.image.trim() ? webUrl(fields.image.trim()) : null;
  if (fields.image.trim() && !image) return { ok: false, field: "image", message: "Enter a full HTTP or HTTPS image URL, or leave it empty." };
  const name = escape(title), text = escape(description), canonical = escape(url.href);
  const card = image ? "summary_large_image" : "summary";
  const html = [
    `<title>${name}</title>`, `<meta name="description" content="${text}">`, `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="website">`, `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:title" content="${name}">`, `<meta property="og:description" content="${text}">`,
    `<meta name="twitter:card" content="${card}">`, `<meta name="twitter:title" content="${name}">`,
    `<meta name="twitter:description" content="${text}">`,
    ...(image ? [`<meta property="og:image" content="${escape(image.href)}">`, `<meta name="twitter:image" content="${escape(image.href)}">`] : []),
  ].join("\n");
  return { ok: true, data: { html, host: url.host, card } };
}
