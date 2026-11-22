"use client";

import { useEffect, useMemo, useState } from "react";
import * as E from "@/lib/engines";
import type { ToolKind } from "@/lib/tools";
import { CopyButton } from "./copy-button";
import { DownloadButton } from "./download-button";
import { MetaWorkbench } from "./meta-workbench";
import { Glyph } from "./glyph";

export function Workbench({ kind, slug }: { kind: ToolKind; slug: string }) {
  const [example, setExample] = useState(0);
  return (
    <section aria-label="Browser workbench" className="card min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-raised/60 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <Glyph name="terminal" className="text-lime" />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Browser workbench
          </span>
        </div>
        <button className="result-action" type="button" onClick={() => setExample(n => n + 1)}><Glyph name="reset" size={13} />Reset example</button>
      </div>
      <div className="p-4 sm:p-5">
        <Body kind={kind} key={`${kind}-${example}`} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
        <span className="flex items-center gap-2"><Glyph name="shield" size={14} className="text-lime" /> Input stays in this tab</span>
        <a href="#api-example" className="font-mono text-cyan hover:underline">POST /v1/{slug} ↓</a>
      </div>
    </section>
  );
}

function Body({ kind }: { kind: ToolKind }) {
  switch (kind) {
    case "base64":
      return <Base64 />;
    case "hash":
      return <Hash />;
    case "uuid":
      return <Uuid />;
    case "slug":
      return <Slug />;
    case "case":
      return <CaseTool />;
    case "json":
      return <JsonTool />;
    case "jwt":
      return <Jwt />;
    case "wordcount":
      return <WordCount />;
    case "lorem":
      return <Lorem />;
    case "password":
      return <Password />;
    case "color":
      return <Color />;
    case "cron":
      return <Cron />;
    case "utm":
      return <Utm />;
    case "robots":
      return <Robots />;
    case "email":
      return <Email />;
    case "csv":
      return <Csv />;
    case "meta":
      return <MetaWorkbench />;
    default:
      return <p className="text-sm text-muted">This tool is not wired up yet.</p>;
  }
}

/* ── primitives ─────────────────────────────────────────────────── */

function Label({ children, hint, htmlFor }: { children: React.ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      {htmlFor ? <label className="label" htmlFor={htmlFor}>{children}</label> : <span className="label">{children}</span>}
      {hint ? <span className="font-mono text-[10px] text-faint">{hint}</span> : null}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-line bg-black/30 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`min-h-8 rounded-[6px] px-2.5 py-1 text-xs transition ${
            value === o.value ? "bg-lime/10 text-lime" : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Out({ value, label = "output", filename }: { value: string; label?: string; filename?: string }) {
  const error = label === "error";
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="label">{label}</span>
        {!error && <div className="flex gap-1.5">{filename && <DownloadButton value={value} filename={filename} />}<CopyButton value={value} label="Copy output" /></div>}
      </div>
      <pre tabIndex={0} role={error ? "alert" : "group"} aria-label={label} className={`max-h-80 overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] ${error ? "border-amber/35 bg-amber/5 text-amber" : "border-line bg-ink text-fg"}`}>
        {value || " "}
      </pre>
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2 [&>*]:min-w-0">{children}</div>;
}

/* ── tools ──────────────────────────────────────────────────────── */

function Base64() {
  const [input, setInput] = useState("Toolzync — every utility, one key.");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const { output, error } = useMemo(() => {
    try {
      return {
        output: mode === "encode" ? E.toBase64(input, urlSafe) : E.fromBase64(input, urlSafe),
        error: null as string | null,
      };
    } catch {
      return { output: "", error: "That does not look like valid Base64." };
    }
  }, [input, mode, urlSafe]);

  return (
    <TwoCol>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="base-input">Input</Label>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "encode", label: "Encode" },
              { value: "decode", label: "Decode" },
            ]}
          />
        </div>
        <textarea
          id="base-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={7}
          className="field font-mono text-[12px]"
        />
        <label className="mt-2 flex items-center gap-2 text-[12px] text-muted">
          <input
            type="checkbox"
            checked={urlSafe}
            onChange={(e) => setUrlSafe(e.target.checked)}
            className="accent-lime"
          />
          URL-safe alphabet
        </label>
      </div>
      <div>
        <Out value={error ?? output} label={error ? "error" : "output"} />
        <p className="mt-2 text-[11.5px] text-faint">
          {error ? "Check the padding and alphabet." : `${output.length} characters`}
        </p>
      </div>
    </TwoCol>
  );
}

function Hash() {
  const [input, setInput] = useState("hello toolzync");
  const [algo, setAlgo] = useState<"SHA-1" | "SHA-256" | "SHA-384" | "SHA-512">("SHA-256");
  const [output, setOutput] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    E.hashText(input, algo)
      .then((hash) => {
        if (!cancelled) { setOutput(hash); setUnavailable(false); }
      })
      .catch(() => {
        if (!cancelled) { setOutput(""); setUnavailable(true); }
      });
    return () => {
      cancelled = true;
    };
  }, [input, algo]);

  return (
    <TwoCol>
      <div>
        <Label htmlFor="hash-input" hint={`${algo.replace("SHA-", "sha")} · hex`}>Input</Label>
        <textarea
          id="hash-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={7}
          className="field font-mono text-[12px]"
        />
        <div className="mt-2">
          <Segmented
            value={algo}
            onChange={setAlgo}
            options={[
              { value: "SHA-1", label: "SHA-1" },
              { value: "SHA-256", label: "SHA-256" },
              { value: "SHA-384", label: "SHA-384" },
              { value: "SHA-512", label: "SHA-512" },
            ]}
          />
        </div>
      </div>
      <div>
        <Out value={unavailable ? "Open this workbench over HTTPS or on localhost to use browser hashing." : output} label={unavailable ? "error" : "Hex digest"} />
      </div>
    </TwoCol>
  );
}

function Uuid() {
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [list, setList] = useState<string[]>([]);

  const generate = () => {
    const n = Math.min(Math.max(count || 1, 1), 100);
    setList(Array.from({ length: n }, () => E.uuidV4()));
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => setList(Array.from({ length: 5 }, () => E.uuidV4())));
    return () => cancelAnimationFrame(id);
  }, []);

  const output = list.map((id) => (upper ? id.toUpperCase() : id)).join("\n");

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-28">
          <Label htmlFor="uuid-count">How many</Label>
          <input
            id="uuid-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="field font-mono"
          />
        </div>
        <label className="mb-2 flex items-center gap-2 text-[12px] text-muted">
          <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="accent-lime" />
          uppercase
        </label>
        <button type="button" onClick={generate} className="btn btn-primary mb-0.5">
          Generate
        </button>
      </div>
      <div className="mt-4">
        <Out value={output} label={`${list.length} × uuid v4`} />
      </div>
    </div>
  );
}

function Slug() {
  const [input, setInput] = useState("How to ship 10× faster with one API key");
  const [sep, setSep] = useState<"-" | "_">("-");
  const output = E.slugify(input, { separator: sep });
  return (
    <TwoCol>
      <div>
        <Label htmlFor="slug-input">Title or phrase</Label>
        <input id="slug-input" value={input} onChange={(e) => setInput(e.target.value)} className="field" />
        <div className="mt-3">
          <Segmented
            value={sep}
            onChange={setSep}
            options={[
              { value: "-", label: "kebab-case" },
              { value: "_", label: "snake_case" },
            ]}
          />
        </div>
        <p className="mt-3 text-[11.5px] text-faint">
          Diacritics are transliterated, punctuation dropped, repeats collapsed.
        </p>
      </div>
      <div>
        <Label hint={`${output.length} chars`}>slug</Label>
        <Out value={output} />
      </div>
    </TwoCol>
  );
}

const CASE_MODES: { value: E.CaseMode; label: string }[] = [
  { value: "camel", label: "camelCase" },
  { value: "pascal", label: "PascalCase" },
  { value: "snake", label: "snake_case" },
  { value: "kebab", label: "kebab-case" },
  { value: "constant", label: "CONSTANT" },
  { value: "title", label: "Title Case" },
  { value: "sentence", label: "Sentence" },
  { value: "upper", label: "UPPER" },
  { value: "lower", label: "lower" },
  { value: "dot", label: "dot.case" },
];

function CaseTool() {
  const [input, setInput] = useState("user profile settings id");
  const [mode, setMode] = useState<E.CaseMode>("camel");
  return (
    <TwoCol>
      <div>
        <Label htmlFor="case-input">Input</Label>
        <textarea id="case-input" value={input} onChange={(e) => setInput(e.target.value)} rows={5} className="field" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CASE_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={mode === m.value}
              className={`rounded-md border px-2 py-1 font-mono text-[10.5px] transition ${
                mode === m.value
                  ? "border-lime/40 bg-lime/10 text-lime"
                  : "border-line text-muted hover:text-fg"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>{mode}</Label>
        <Out value={E.convertCase(input, mode)} />
      </div>
    </TwoCol>
  );
}

function JsonTool() {
  const [input, setInput] = useState('{"plan":"pro","limits":{"requests":50000},"tools":["base64","hash"]}');
  const [mode, setMode] = useState<"pretty" | "minify" | "sort">("pretty");
  const { output, error } = useMemo(() => {
    try {
      return { output: E.formatJson(input, mode), error: null as string | null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input, mode]);
  return (
    <TwoCol>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="json-input">JSON input</Label>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "pretty", label: "Pretty" },
              { value: "minify", label: "Minify" },
              { value: "sort", label: "Sort keys" },
            ]}
          />
        </div>
        <textarea id="json-input" spellCheck={false} aria-invalid={Boolean(error)} value={input} onChange={(e) => setInput(e.target.value)} rows={10} className="field font-mono text-xs" />
      </div>
      <div>
        <Out value={error ?? output} label={error ? "error" : "Formatted JSON"} filename="formatted.json" />
      </div>
    </TwoCol>
  );
}

function Jwt() {
  const [token, setToken] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ay1kZW1vIiwicGxhbiI6InBybyIsImlhdCI6MTc2MzAwMDAwMCwiZXhwIjoxNzk0NTM2MDAwfQ.c2lnbmF0dXJl",
  );
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(id);
  }, [token]);

  const { parts, error } = useMemo(() => {
    try {
      return { parts: E.decodeJwt(token, now), error: null as string | null };
    } catch (e) {
      return { parts: null, error: e instanceof Error ? e.message : "Cannot decode token" };
    }
  }, [token, now]);

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="jwt-token">Token</Label>
        <textarea id="jwt-token" spellCheck={false} value={token} onChange={(e) => setToken(e.target.value)} rows={4} className="field font-mono text-xs break-all" />
      </div>
      {error ? (
        <p className="rounded-xl border border-amber/30 bg-amber/5 p-3 font-mono text-[11.5px] text-amber">{error}</p>
      ) : parts ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="label">header</span>
              {parts.expired !== null && (
                <span className={`chip ${parts.expired ? "!border-amber/40 !text-amber" : "!border-lime/40 !text-lime"}`}>
                  {parts.expired ? "expired" : "valid window"}
                </span>
              )}
            </div>
            <Out value={JSON.stringify(parts.header, null, 2)} label="header" />
            <p className="mt-2 font-mono text-[10.5px] text-faint">
              exp: {parts.expiresAt ?? "—"} · iat: {parts.issuedAt ?? "—"}
            </p>
          </div>
          <div>
            <Label>payload</Label>
            <Out value={JSON.stringify(parts.payload, null, 2)} label="claims" />
          </div>
        </div>
      ) : null}
      <p className="text-[11.5px] text-faint">
        Decoding is not verification. Always validate the signature with the issuer&apos;s JWKS.
      </p>
    </div>
  );
}

function WordCount() {
  const [input, setInput] = useState(
    "The studio opens early on Fridays. We share a coffee, compare notes, and make a short list of ideas to try before lunch.",
  );
  const stats = E.countText(input);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <Label htmlFor="word-input">Text</Label>
        <textarea id="word-input" value={input} onChange={(e) => setInput(e.target.value)} rows={10} className="field" />
      </div>
      <div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["words", stats.words],
            ["chars", stats.characters],
            ["no spaces", stats.charactersNoSpaces],
            ["sentences", stats.sentences],
            ["paragraphs", stats.paragraphs],
            ["lines", stats.lines],
            ["read min", stats.readingTimeMinutes],
            ["speak min", stats.speakingTimeMinutes],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-white/[0.02] p-2.5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">{label}</p>
              <p className="mt-1 font-mono text-lg text-fg">{value}</p>
            </div>
          ))}
        </div>
        {stats.topKeywords.length > 0 && (
          <div className="mt-3">
            <Label>top keywords</Label>
            <div className="flex flex-wrap gap-1.5">
              {stats.topKeywords.map((k) => (
                <span key={k.word} className="chip">
                  {k.word} <span className="text-lime">{k.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Lorem() {
  const [count, setCount] = useState(3);
  const [unit, setUnit] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [seed, setSeed] = useState(7);
  const output = E.lorem(count, unit, seed);
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-24">
          <Label htmlFor="lorem-count">Count</Label>
          <input id="lorem-count" type="number" min={1} max={unit === "words" ? 500 : 20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="field font-mono" />
        </div>
        <div>
          <Label>unit</Label>
          <Segmented
            value={unit}
            onChange={setUnit}
            options={[
              { value: "paragraphs", label: "Paragraphs" },
              { value: "sentences", label: "Sentences" },
              { value: "words", label: "Words" },
            ]}
          />
        </div>
        <div className="w-24">
          <Label htmlFor="lorem-seed">Seed</Label>
          <input id="lorem-seed" type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} className="field font-mono" />
        </div>
      </div>
      <div className="mt-4">
        <Out value={output} label={`${count} ${unit}`} />
      </div>
    </div>
  );
}

function Password() {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [value, setValue] = useState("");
  const [passphrase, setPassphrase] = useState(false);

  const regenerate = () => setValue(E.generatePassword({ length, ...opts, passphrase, words: 4 }));

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setValue(E.generatePassword({ length: 20, upper: true, lower: true, digits: true, symbols: true })),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  const entropy = value ? E.estimateEntropy(value) : 0;
  const strength = entropy < 45 ? "weak" : entropy < 70 ? "fair" : entropy < 100 ? "strong" : "excellent";
  const pct = Math.min(100, Math.round((entropy / 128) * 100));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <Label htmlFor="password-length" hint={`${length} chars`}>Length</Label>
        <input id="password-length" type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full accent-lime" disabled={passphrase} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["upper", "lower", "digits", "symbols"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 text-[12px] text-muted">
              <input
                type="checkbox"
                checked={opts[key]}
                onChange={(e) => setOpts({ ...opts, [key]: e.target.checked })}
                className="accent-lime"
                disabled={passphrase}
              />
              {key}
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-[12px] text-muted">
          <input type="checkbox" checked={passphrase} onChange={(e) => setPassphrase(e.target.checked)} className="accent-lime" />
          passphrase mode (4 words)
        </label>
        {!passphrase && !Object.values(opts).some(Boolean) && <p role="status" className="mt-2 text-xs text-amber">Select a character set to generate a password.</p>}
        <button type="button" onClick={regenerate} disabled={!passphrase && !Object.values(opts).some(Boolean)} className="btn btn-primary mt-4 disabled:opacity-50">
          Regenerate
        </button>
      </div>
      <div>
        <Label hint={`${entropy} bits · ${strength}`}>password</Label>
        <div className="flex items-center gap-2">
          <code className="flex-1 break-all rounded-xl border border-line bg-black/40 p-3 font-mono text-[13px] text-lime">
            {value}
          </code>
          <CopyButton value={value} label="Copy password" />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber via-lime to-cyan transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-[11.5px] text-faint">
          Values come from <code className="font-mono">crypto.getRandomValues</code>. Nothing leaves this tab.
        </p>
      </div>
    </div>
  );
}

function Color() {
  const [hex, setHex] = useState("#ccf75a");
  const { data, error } = useMemo(() => {
    try {
      return { data: E.palette(hex), error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Invalid colour" };
    }
  }, [hex]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Label htmlFor="palette-hex">Hex color</Label>
          <input id="palette-hex" value={hex} onChange={(e) => setHex(e.target.value)} className="field font-mono" />
        </div>
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#ccf75a"}
          onChange={(e) => setHex(e.target.value)}
          className="mb-0.5 h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent"
          aria-label="Pick colour"
        />
        {data && (
          <div className="mb-1 flex gap-4 font-mono text-[11px] text-muted">
            <span>{data.base.rgb}</span>
            <span>{data.base.hsl}</span>
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-3 font-mono text-[11.5px] text-amber">{error}</p>
      ) : data ? (
        <>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
            {data.shades.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setHex(s.hex)}
                className="group overflow-hidden rounded-lg border border-line text-left"
                title={`${s.hex} · click to use`}
              >
                <span className="block h-12 w-full" style={{ backgroundColor: s.hex }} />
                <span className="block px-1.5 py-1 font-mono text-[9px] text-faint group-hover:text-fg">{s.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end"><DownloadButton filename="palette.css" value={`:root {\n${data.shades.map(s => `  --palette-${s.name}: ${s.hex};`).join("\n")}\n}\n`} /></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.shades.slice(0, 4).map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-3 py-2 font-mono text-[10.5px]">
                <span className="text-muted">{s.hex}</span>
                <span className="text-faint">on white {s.contrastOnWhite} · on black {s.contrastOnBlack}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Cron() {
  const [expr, setExpr] = useState("*/15 9-17 * * MON-FRI");
  const [runs, setRuns] = useState<string[]>([]);
  const result = useMemo(() => E.parseCron(expr, null), [expr]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setRuns(E.parseCron(expr).nextRuns));
    return () => cancelAnimationFrame(id);
  }, [expr]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <Label htmlFor="cron-expr" hint="min hour dom month dow">Expression</Label>
        <input id="cron-expr" value={expr} onChange={(e) => setExpr(e.target.value)} className="field font-mono" />
        <p className={`mt-3 text-[13px] ${result.valid ? "text-fg" : "text-amber"}`}>{result.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["*/5 * * * *", "0 9 * * MON-FRI", "0 0 1 * *", "30 2 * * SUN"].map((preset) => (
            <button key={preset} type="button" onClick={() => setExpr(preset)} className="chip hover:text-fg">
              {preset}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>next runs (UTC)</Label>
        <Out
          value={runs.length ? runs.join("\n") : "—"}
          label="schedule"
        />
      </div>
    </div>
  );
}

function Utm() {
  const [form, setForm] = useState({
    url: "https://toolzync.com/pricing",
    source: "newsletter",
    medium: "email",
    campaign: "launch_2026",
    term: "",
    content: "hero_cta",
  });
  const { url, error } = useMemo(() => {
    try {
      return { url: E.buildUtm(form), error: null as string | null };
    } catch (e) {
      return { url: "", error: e instanceof Error ? e.message : "Invalid URL" };
    }
  }, [form]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid gap-3">
        {(
          [
            ["url", "destination url"],
            ["source", "utm_source"],
            ["medium", "utm_medium"],
            ["campaign", "utm_campaign"],
            ["term", "utm_term"],
            ["content", "utm_content"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <Label htmlFor={`utm-${key}`}>{label}</Label>
            <input id={`utm-${key}`} value={form[key]} onChange={set(key)} className="field font-mono text-[12px]" />
          </div>
        ))}
      </div>
      <div>
        <Label>campaign url</Label>
        <Out value={error ?? url} label={error ? "error" : "url"} />
      </div>
    </div>
  );
}

function Robots() {
  const [agent, setAgent] = useState("*");
  const [disallow, setDisallow] = useState("/admin\n/api/internal\n/cart");
  const [allow, setAllow] = useState("/api/public");
  const [sitemap, setSitemap] = useState("https://toolzync.com/sitemap.xml");
  const output = E.buildRobots(
    [{ agent, disallow: disallow.split("\n"), allow: allow.split("\n") }],
    sitemap,
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid gap-3">
        <div>
          <Label htmlFor="robots-agent">User-agent</Label>
          <input id="robots-agent" value={agent} onChange={(e) => setAgent(e.target.value)} className="field font-mono text-[12px]" />
        </div>
        <div>
          <Label htmlFor="robots-disallow" hint="one per line">Disallow</Label>
          <textarea id="robots-disallow" value={disallow} onChange={(e) => setDisallow(e.target.value)} rows={4} className="field font-mono text-[12px]" />
        </div>
        <div>
          <Label htmlFor="robots-allow" hint="one per line">Allow</Label>
          <textarea id="robots-allow" value={allow} onChange={(e) => setAllow(e.target.value)} rows={3} className="field font-mono text-[12px]" />
        </div>
        <div>
          <Label htmlFor="robots-sitemap">Sitemap</Label>
          <input id="robots-sitemap" value={sitemap} onChange={(e) => setSitemap(e.target.value)} className="field font-mono text-[12px]" />
        </div>
      </div>
      <div>
        <Out value={output} label="robots.txt" filename="robots.txt" />
      </div>
    </div>
  );
}

function Email() {
  const [value, setValue] = useState("ada@toolzync.com");
  const check = E.validateEmail(value);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <Label htmlFor="email-address">Address</Label>
        <input id="email-address" value={value} onChange={(e) => setValue(e.target.value)} className="field font-mono" />
        <p className="mt-3 text-[11.5px] text-faint">
          Checks syntax, known disposable domains and common typos. It does not check whether the mailbox exists.
        </p>
      </div>
      <div className="rounded-xl border border-line bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <span className="label">verdict</span>
          <span className={`chip ${check.valid ? "!border-lime/40 !text-lime" : "!border-amber/40 !text-amber"}`}>
            {check.valid ? "valid syntax" : "invalid"}
          </span>
        </div>
        <dl className="mt-3 space-y-2 font-mono text-[11.5px]">
          <div className="flex justify-between gap-4">
            <dt className="text-faint">local</dt>
            <dd className="truncate text-fg/90">{check.local ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">domain</dt>
            <dd className="text-fg/90">{check.domain ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">disposable</dt>
            <dd className={check.disposable ? "text-amber" : "text-fg/90"}>{String(check.disposable)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-faint">free provider</dt>
            <dd className="text-fg/90">{String(check.freeProvider)}</dd>
          </div>
        </dl>
        {check.suggestion && (
          <p className="mt-3 rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-2 font-mono text-[11px] text-cyan">
            did you mean {check.suggestion}?
          </p>
        )}
        {check.reasons.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-4 font-mono text-[11px] text-amber">
            {check.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Csv() {
  const [protectCells, setProtectCells] = useState(true);
  const [input, setInput] = useState(
    '[{"id":1,"name":"Ada","plan":{"tier":"pro","seats":3}},{"id":2,"name":"Lin","plan":{"tier":"free","seats":1}}]',
  );
  const { data, error } = useMemo(() => {
    try {
      return { data: E.jsonToCsv(input, protectCells), error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input, protectCells]);
  return (
    <TwoCol>
      <div>
        <Label htmlFor="csv-json" hint="array of objects">JSON input</Label>
        <textarea id="csv-json" value={input} spellCheck={false} onChange={(e) => setInput(e.target.value)} rows={11} className="field font-mono text-xs" />
        <label className="mt-2 flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={protectCells} onChange={e => setProtectCells(e.target.checked)} className="accent-lime" />Treat formula-like text as text in spreadsheets</label>
      </div>
      <div>
        <Out value={error ?? data?.csv ?? ""} label={error ? "error" : `CSV · ${data?.rows ?? 0} rows`} filename="table.csv" />
      </div>
    </TwoCol>
  );
}
