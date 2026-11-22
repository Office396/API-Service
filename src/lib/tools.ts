export type ToolSurface = "web" | "api" | "both";

export type ToolKind =
  | "base64"
  | "hash"
  | "uuid"
  | "slug"
  | "case"
  | "json"
  | "jwt"
  | "wordcount"
  | "lorem"
  | "password"
  | "color"
  | "cron"
  | "utm"
  | "robots"
  | "email"
  | "csv"
  | "meta";

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  category: CategorySlug;
  surface: ToolSurface;
  kind?: ToolKind;
  live: boolean;
  keywords?: string[];
};

export type CategorySlug =
  | "documents"
  | "images"
  | "media"
  | "text"
  | "dev"
  | "seo"
  | "security"
  | "commerce"
  | "ai";

export type Category = {
  slug: CategorySlug;
  name: string;
  blurb: string;
};

export const categories: Category[] = [
  {
    slug: "dev",
    name: "Developer & data",
    blurb: "The primitives you keep re-Googling. Encoders, hashes, parsers, decoders.",
  },
  {
    slug: "text",
    name: "Text",
    blurb: "Clean, transform and count text without shipping it to a black box.",
  },
  {
    slug: "documents",
    name: "Documents & PDF",
    blurb: "Convert, merge, split and read documents programmatically.",
  },
  {
    slug: "images",
    name: "Images",
    blurb: "Convert, compress and generate image assets on demand.",
  },
  {
    slug: "media",
    name: "Audio & video",
    blurb: "Extract, transcode and transcribe media through one endpoint.",
  },
  {
    slug: "seo",
    name: "SEO",
    blurb: "Ship correct sitemaps, metadata and campaign links by default.",
  },
  {
    slug: "security",
    name: "Security & network",
    blurb: "Secrets, DNS, TLS and CORS checks you can wire into CI.",
  },
  {
    slug: "commerce",
    name: "Social & commerce",
    blurb: "Thumbnails, social crops, signatures and barcodes at scale.",
  },
  {
    slug: "ai",
    name: "AI utilities",
    blurb: "Metered model-backed helpers behind the same key and limits.",
  },
];

const tools: Tool[] = [
  // ── Developer & data ───────────────────────────────────────────────
  {
    slug: "base64",
    name: "Base64 encoder",
    tagline: "Encode and decode text with the standard or URL-safe Base64 alphabet.",
    category: "dev",
    surface: "both",
    kind: "base64",
    live: true,
    keywords: ["b64", "encode", "decode", "base64url"],
  },
  {
    slug: "hash-generator",
    name: "Hash generator",
    tagline: "SHA-1, SHA-256, SHA-384 and SHA-512 digests in one call.",
    category: "dev",
    surface: "both",
    kind: "hash",
    live: true,
    keywords: ["sha256", "sha1", "checksum", "digest"],
  },
  {
    slug: "uuid-generator",
    name: "UUID generator",
    tagline: "RFC 4122 v4 identifiers, single or batched, with optional formatting.",
    category: "dev",
    surface: "both",
    kind: "uuid",
    live: true,
    keywords: ["guid", "v4", "id"],
  },
  {
    slug: "jwt-decoder",
    name: "JWT decoder",
    tagline: "Inspect header and claims without verifying signatures server-side.",
    category: "dev",
    surface: "both",
    kind: "jwt",
    live: true,
    keywords: ["token", "claims", "auth", "jose"],
  },
  {
    slug: "cron-parser",
    name: "Cron parser",
    tagline: "Explain a cron expression in plain English and list next run times.",
    category: "dev",
    surface: "both",
    kind: "cron",
    live: true,
    keywords: ["schedule", "crontab", "cron expression"],
  },
  {
    slug: "regex-tester",
    name: "Regex tester",
    tagline: "Match, capture and replace against sample input with timeout guards.",
    category: "dev",
    surface: "both",
    live: false,
    keywords: ["pattern", "regexp", "replace"],
  },
  {
    slug: "fake-data",
    name: "Fake data generator",
    tagline: "Deterministic people, addresses, companies and cards for fixtures.",
    category: "dev",
    surface: "both",
    live: false,
    keywords: ["mock", "fixture", "seed", "faker"],
  },
  {
    slug: "color-palette",
    name: "Color palette",
    tagline: "Build tints and shades from any hex, return hex, RGB, HSL and contrast.",
    category: "dev",
    surface: "both",
    kind: "color",
    live: true,
    keywords: ["colour", "hex", "hsl", "contrast", "shades", "tailwind"],
  },
  {
    slug: "user-agent-parser",
    name: "User-agent parser",
    tagline: "Browser, engine, OS and device type from a raw user-agent string.",
    category: "dev",
    surface: "both",
    live: false,
    keywords: ["ua", "browser", "device"],
  },
  {
    slug: "ip-lookup",
    name: "IP lookup",
    tagline: "Geolocation, ASN and reverse DNS for IPv4 and IPv6 addresses.",
    category: "dev",
    surface: "api",
    live: false,
    keywords: ["geoip", "asn", "whois"],
  },
  {
    slug: "webhook-tester",
    name: "Webhook tester",
    tagline: "Mint a throwaway URL, inspect delivered payloads, replay them.",
    category: "dev",
    surface: "both",
    live: false,
    keywords: ["callback", "http", "inspect"],
  },
  {
    slug: "json-to-csv",
    name: "JSON to CSV",
    tagline: "Flatten nested JSON arrays into CSV with stable column ordering.",
    category: "dev",
    surface: "both",
    kind: "csv",
    live: true,
    keywords: ["convert", "spreadsheet", "export"],
  },
  {
    slug: "json-to-xml",
    name: "JSON to XML",
    tagline: "Convert JSON trees to well-formed XML with attribute hints.",
    category: "dev",
    surface: "both",
    live: false,
    keywords: ["convert", "xml", "transform"],
  },

  // ── Text ───────────────────────────────────────────────────────────
  {
    slug: "case-converter",
    name: "Case converter",
    tagline: "camelCase, snake_case, kebab-case, title and sentence case.",
    category: "text",
    surface: "both",
    kind: "case",
    live: true,
    keywords: ["camel", "snake", "kebab", "title"],
  },
  {
    slug: "word-counter",
    name: "Word counter",
    tagline: "Words, characters, sentences, reading time and keyword density.",
    category: "text",
    surface: "both",
    kind: "wordcount",
    live: true,
    keywords: ["count", "characters", "reading time"],
  },
  {
    slug: "lorem-ipsum",
    name: "Lorem ipsum",
    tagline: "Paragraphs, sentences or words with a fixed seed for repeatability.",
    category: "text",
    surface: "both",
    kind: "lorem",
    live: true,
    keywords: ["placeholder", "dummy", "filler"],
  },
  {
    slug: "slug-generator",
    name: "Slug generator",
    tagline: "Turn a title into a URL slug with clean separators and normalized accents.",
    category: "text",
    surface: "both",
    kind: "slug",
    live: true,
    keywords: ["url", "seo", "permalink"],
  },
  {
    slug: "json-formatter",
    name: "JSON formatter",
    tagline: "Check JSON, pretty-print it, sort keys or minify it for transport.",
    category: "text",
    surface: "both",
    kind: "json",
    live: true,
    keywords: ["pretty", "minify", "validate", "lint"],
  },
  {
    slug: "markdown-to-html",
    name: "Markdown to HTML",
    tagline: "CommonMark with tables, footnotes and safe-mode sanitisation.",
    category: "text",
    surface: "both",
    live: false,
    keywords: ["md", "commonmark", "render"],
  },
  {
    slug: "text-to-speech",
    name: "Text to speech",
    tagline: "Natural narration with per-request voice, speed and format controls.",
    category: "text",
    surface: "api",
    live: false,
    keywords: ["tts", "voice", "audio"],
  },
  {
    slug: "text-diff",
    name: "Text diff",
    tagline: "Word and character diffs rendered as unified patches.",
    category: "text",
    surface: "both",
    live: false,
    keywords: ["compare", "patch", "changes"],
  },

  // ── Documents ──────────────────────────────────────────────────────
  {
    slug: "html-to-pdf",
    name: "HTML to PDF",
    tagline: "Render pixel-accurate PDFs from HTML with headers, margins and waits.",
    category: "documents",
    surface: "api",
    live: false,
    keywords: ["pdf", "print", "render", "chromium"],
  },
  {
    slug: "markdown-to-pdf",
    name: "Markdown to PDF",
    tagline: "Typeset Markdown into a styled, paginated PDF in one request.",
    category: "documents",
    surface: "api",
    live: false,
    keywords: ["pdf", "markdown", "report"],
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    tagline: "Combine PDFs in a defined order, with optional bookmarks.",
    category: "documents",
    surface: "both",
    live: false,
    keywords: ["pdf", "combine", "join"],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    tagline: "Extract page ranges into new documents with a single call.",
    category: "documents",
    surface: "both",
    live: false,
    keywords: ["pdf", "extract", "pages"],
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    tagline: "Shrink PDFs with quality targets and a guaranteed size ceiling.",
    category: "documents",
    surface: "both",
    live: false,
    keywords: ["pdf", "size", "optimize"],
  },
  {
    slug: "pdf-to-text",
    name: "PDF to text",
    tagline: "Layout-aware text extraction, with OCR fallback for scans.",
    category: "documents",
    surface: "api",
    live: false,
    keywords: ["pdf", "extract", "ocr", "text"],
  },
  {
    slug: "pdf-to-json",
    name: "PDF to JSON",
    tagline: "Structured extraction: pages, blocks, tables and reading order.",
    category: "documents",
    surface: "api",
    live: false,
    keywords: ["pdf", "parse", "tables", "ocr"],
  },
  {
    slug: "watermark-pdf",
    name: "Watermark PDF",
    tagline: "Apply text or image watermarks with opacity and placement rules.",
    category: "documents",
    surface: "api",
    live: false,
    keywords: ["pdf", "stamp", "brand"],
  },

  // ── Images ─────────────────────────────────────────────────────────
  {
    slug: "heic-to-jpg",
    name: "HEIC to JPG",
    tagline: "Convert iPhone photos to widely supported JPEG or PNG.",
    category: "images",
    surface: "both",
    live: false,
    keywords: ["heic", "apple", "convert"],
  },
  {
    slug: "webp-to-png",
    name: "WebP to PNG",
    tagline: "Lossless conversion with alpha preserved and metadata dropped.",
    category: "images",
    surface: "both",
    live: false,
    keywords: ["webp", "png", "convert"],
  },
  {
    slug: "compress-image",
    name: "Image compressor",
    tagline: "Quality and size targets across JPEG, WebP and AVIF.",
    category: "images",
    surface: "both",
    live: false,
    keywords: ["optimize", "jpeg", "avif", "webp"],
  },
  {
    slug: "resize-image",
    name: "Image resizer",
    tagline: "Smart crops and exact dimensions with retina-friendly presets.",
    category: "images",
    surface: "both",
    live: false,
    keywords: ["resize", "crop", "thumbnail"],
  },
  {
    slug: "qr-code",
    name: "QR code generator",
    tagline: "SVG or PNG QR codes with logo slots, colours and error correction.",
    category: "images",
    surface: "both",
    live: false,
    keywords: ["qr", "barcode", "svg", "png"],
  },
  {
    slug: "favicon-generator",
    name: "Favicon generator",
    tagline: "Full icon set with manifest, maskable sizes and HTML snippet.",
    category: "images",
    surface: "both",
    live: false,
    keywords: ["ico", "apple-touch", "manifest"],
  },
  {
    slug: "exif-remover",
    name: "EXIF remover",
    tagline: "Strip GPS and camera metadata before publishing images.",
    category: "images",
    surface: "both",
    live: false,
    keywords: ["privacy", "metadata", "gps"],
  },

  // ── Audio & video ──────────────────────────────────────────────────
  {
    slug: "youtube-to-mp3",
    name: "YouTube to MP3",
    tagline: "Audio extraction with bitrate selection and loudness normalisation.",
    category: "media",
    surface: "both",
    live: false,
    keywords: ["youtube", "mp3", "audio"],
  },
  {
    slug: "video-downloader",
    name: "Video downloader",
    tagline: "Fetch public videos across supported sites in the best available quality.",
    category: "media",
    surface: "api",
    live: false,
    keywords: ["download", "mp4", "sites"],
  },
  {
    slug: "video-to-gif",
    name: "Video to GIF",
    tagline: "Trimmed, optimised GIFs with palette control and frame limits.",
    category: "media",
    surface: "both",
    live: false,
    keywords: ["gif", "clip", "loop"],
  },
  {
    slug: "audio-converter",
    name: "Audio converter",
    tagline: "MP3, WAV, FLAC, OGG and AAC transcoding with sample-rate control.",
    category: "media",
    surface: "both",
    live: false,
    keywords: ["transcode", "wav", "flac", "m4a"],
  },
  {
    slug: "extract-audio",
    name: "Extract audio",
    tagline: "Pull the audio track out of any video without re-encoding when possible.",
    category: "media",
    surface: "both",
    live: false,
    keywords: ["audio", "track", "demux"],
  },
  {
    slug: "video-thumbnail",
    name: "Video thumbnail",
    tagline: "Grab frames at exact timestamps, with contact-sheet output.",
    category: "media",
    surface: "both",
    live: false,
    keywords: ["frame", "poster", "sprite"],
  },
  {
    slug: "video-compressor",
    name: "Video compressor",
    tagline: "Target a bitrate or file size with two-pass encoding.",
    category: "media",
    surface: "api",
    live: false,
    keywords: ["encode", "bitrate", "size"],
  },
  {
    slug: "speech-to-text",
    name: "Speech to text",
    tagline: "Timestamped transcription and subtitles for any audio or video file.",
    category: "media",
    surface: "api",
    live: false,
    keywords: ["transcribe", "whisper", "subtitles", "srt"],
  },

  // ── SEO ────────────────────────────────────────────────────────────
  {
    slug: "sitemap-generator",
    name: "Sitemap generator",
    tagline: "Crawl a domain and emit a sitemap index with last-modified data.",
    category: "seo",
    surface: "both",
    live: false,
    keywords: ["sitemap", "crawl", "xml"],
  },
  {
    slug: "meta-tag-generator",
    name: "Meta tag generator",
    tagline: "Preview a shared link and generate title, canonical, Open Graph and social tags.",
    category: "seo",
    surface: "both",
    kind: "meta",
    live: true,
    keywords: ["og", "twitter card", "meta", "link preview", "open graph"],
  },
  {
    slug: "utm-builder",
    name: "UTM builder",
    tagline: "Build a campaign URL with source, medium, campaign, term and content tags.",
    category: "seo",
    surface: "both",
    kind: "utm",
    live: true,
    keywords: ["campaign", "analytics", "tracking"],
  },
  {
    slug: "robots-txt",
    name: "robots.txt builder",
    tagline: "Compose allow and disallow rules and export a robots.txt file.",
    category: "seo",
    surface: "both",
    kind: "robots",
    live: true,
    keywords: ["robots", "crawler", "disallow"],
  },
  {
    slug: "og-image-generator",
    name: "OG image generator",
    tagline: "Render branded social cards from a template and query params.",
    category: "seo",
    surface: "api",
    live: false,
    keywords: ["open graph", "social", "card"],
  },
  {
    slug: "serp-preview",
    name: "SERP preview",
    tagline: "See how a title, description and URL truncate in search results.",
    category: "seo",
    surface: "web",
    live: false,
    keywords: ["google", "preview", "snippet"],
  },

  // ── Security & network ─────────────────────────────────────────────
  {
    slug: "password-generator",
    name: "Password generator",
    tagline: "Generate random passwords with your choice of length and character sets.",
    category: "security",
    surface: "both",
    kind: "password",
    live: true,
    keywords: ["password", "passphrase", "random"],
  },
  {
    slug: "password-strength",
    name: "Password strength",
    tagline: "Entropy estimate, breach exposure and actionable feedback.",
    category: "security",
    surface: "both",
    live: false,
    keywords: ["entropy", "breach", "strength"],
  },
  {
    slug: "dns-lookup",
    name: "DNS lookup",
    tagline: "A, AAAA, CNAME, MX, TXT, NS and SOA records in one JSON response.",
    category: "security",
    surface: "api",
    live: false,
    keywords: ["dns", "records", "resolver"],
  },
  {
    slug: "ssl-checker",
    name: "SSL checker",
    tagline: "Certificate chain, expiry, issuer and protocol details for a host.",
    category: "security",
    surface: "api",
    live: false,
    keywords: ["tls", "certificate", "expiry"],
  },
  {
    slug: "cors-tester",
    name: "CORS tester",
    tagline: "Probe preflight and actual responses for correct CORS behaviour.",
    category: "security",
    surface: "api",
    live: false,
    keywords: ["cors", "preflight", "headers"],
  },

  // ── Social & commerce ──────────────────────────────────────────────
  {
    slug: "youtube-thumbnails",
    name: "YouTube thumbnails",
    tagline: "Fetch every available thumbnail size for a video ID or URL.",
    category: "commerce",
    surface: "both",
    live: false,
    keywords: ["youtube", "thumbnail", "image"],
  },
  {
    slug: "social-crop",
    name: "Social crop",
    tagline: "Auto-crop one asset into every platform's safe aspect ratio.",
    category: "commerce",
    surface: "both",
    live: false,
    keywords: ["crop", "instagram", "linkedin", "tiktok"],
  },
  {
    slug: "email-signature",
    name: "Email signature",
    tagline: "Generate table-safe HTML signatures that survive Outlook.",
    category: "commerce",
    surface: "web",
    live: false,
    keywords: ["signature", "html", "outlook"],
  },
  {
    slug: "barcode-generator",
    name: "Barcode generator",
    tagline: "EAN, UPC, Code 128 and QR output as SVG or print-ready PNG.",
    category: "commerce",
    surface: "both",
    live: false,
    keywords: ["ean", "upc", "code128", "label"],
  },
  {
    slug: "website-screenshot",
    name: "Website screenshot",
    tagline: "Full-page or viewport captures at any device profile.",
    category: "commerce",
    surface: "api",
    live: false,
    keywords: ["screenshot", "capture", "full page"],
  },
  {
    slug: "email-validator",
    name: "Email validator",
    tagline: "Check email syntax, flag known disposable domains and suggest common typo fixes.",
    category: "commerce",
    surface: "both",
    kind: "email",
    live: true,
    keywords: ["email", "mx", "disposable"],
  },

  // ── AI ─────────────────────────────────────────────────────────────
  {
    slug: "background-remover",
    name: "Background remover",
    tagline: "Cut subjects out of photos and return transparent PNGs.",
    category: "ai",
    surface: "both",
    live: false,
    keywords: ["remove bg", "alpha", "png"],
  },
  {
    slug: "image-upscaler",
    name: "Image upscaler",
    tagline: "2x–4x upscaling that keeps edges and text legible.",
    category: "ai",
    surface: "both",
    live: false,
    keywords: ["upscale", "super resolution", "4x"],
  },
  {
    slug: "text-summarizer",
    name: "Text summarizer",
    tagline: "Extractive and abstractive summaries with a length target.",
    category: "ai",
    surface: "api",
    live: false,
    keywords: ["summary", "tldr", "condense"],
  },
  {
    slug: "email-rewriter",
    name: "Email rewriter",
    tagline: "Rewrite for tone, brevity or clarity while keeping the facts.",
    category: "ai",
    surface: "both",
    live: false,
    keywords: ["tone", "rewrite", "copy"],
  },
  {
    slug: "auto-tagger",
    name: "Auto tagger",
    tagline: "Keywords and topics for any text or URL, ranked by relevance.",
    category: "ai",
    surface: "api",
    live: false,
    keywords: ["tags", "topics", "keywords"],
  },
];

export const allTools = tools;
export const liveTools = tools.filter((t) => t.live);

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function toolsIn(category: CategorySlug): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function categoryCounts(): Record<CategorySlug, number> {
  const counts = {} as Record<CategorySlug, number>;
  for (const c of categories) counts[c.slug] = 0;
  for (const t of tools) counts[t.category] += 1;
  return counts;
}

export function searchTools(query: string, category?: string): Tool[] {
  const q = query.trim().toLowerCase();
  const base =
    category && category !== "all"
      ? tools.filter((t) => t.category === category)
      : tools;
  if (!q) return base;
  return base.filter((t) => {
    const haystack = `${t.name} ${t.tagline} ${t.slug} ${(t.keywords ?? []).join(" ")} ${
      getCategory(t.category)?.name ?? ""
    }`.toLowerCase();
    return q.split(/\s+/).every((part) => haystack.includes(part));
  });
}

export const popularToolSlugs = [
  "base64",
  "json-formatter",
  "hash-generator",
  "uuid-generator",
  "slug-generator",
  "word-counter",
  "jwt-decoder",
  "password-generator",
];
