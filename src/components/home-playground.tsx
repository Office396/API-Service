"use client";

import Link from "next/link";
import { useState } from "react";
import { formatJson, slugify, toBase64 } from "@/lib/engines";
import { CopyButton } from "./copy-button";
import { Glyph } from "./glyph";
import styles from "./playground.module.css";

const modes = {
  JSON: { slug: "json-formatter", example: '{"project":"toolzync","ready":true}', run: (s: string) => formatJson(s) },
  Base64: { slug: "base64", example: "Hello from the workbench", run: (s: string) => toBase64(s) },
  Slug: { slug: "slug-generator", example: "Notes from the design studio", run: (s: string) => slugify(s) },
};
type Mode = keyof typeof modes;
const modeNames = Object.keys(modes) as Mode[];

// A bundle of traces resolves into one line at the output; only a tool run replays the sweep.
const traces = Array.from({ length: 28 }, (_, i) => {
  const k = i / 27;
  return `M-10 ${70 - k * 45} C28 ${62 - k * 53} 48 ${-33 + k * 149} 86 ${24 + k * 39} S144 ${97 - k * 149} 174 ${42 - k * 20} S205 ${62 + k * 49} 224 ${58 - k * 15} S250 ${32 + k * 16} 282 ${42 - k * 4}`;
});

export function HomePlayground() {
  const [mode, setMode] = useState<Mode>("JSON");
  const [drafts, setDrafts] = useState({ JSON: modes.JSON.example, Base64: modes.Base64.example, Slug: modes.Slug.example });
  const [submitted, setSubmitted] = useState(drafts);
  const [runs, setRuns] = useState(0);
  const draft = drafts[mode];
  const dirty = draft !== submitted[mode];
  let output = "", invalid = false;
  if (!dirty) {
    try { output = modes[mode].run(submitted[mode]); } catch { invalid = true; }
  }
  function run() { setSubmitted(previous => ({ ...previous, [mode]: draft })); setRuns(n => n + 1); }

  return <section aria-labelledby="playground-heading" className={styles.instrument}>
    <div className={styles.face}>
      <div className={styles.legend}><span className={styles.register}>✳</span> TZ / LAB—01</div>
      <h2 id="playground-heading">Live playground</h2>
      <svg className={styles.signal} viewBox="0 0 272 88" aria-hidden="true" preserveAspectRatio="none">
        <g fill="none" stroke="currentColor" strokeWidth=".8">{traces.map(d => <path key={d} d={d} />)}</g>
        <path d="M0 43h272" stroke="currentColor" strokeDasharray="2 5" opacity=".4" />
        <rect key={`${mode}:${runs}`} x="0" y="0" width="6" height="88" className={styles.scan} />
      </svg>
    </div>
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div role="group" aria-label="Playground tool" className={styles.switches}>
          {modeNames.map(name => <button key={name} type="button" aria-pressed={mode === name} onClick={() => setMode(name)}>{name}</button>)}
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted"><i className="size-1.5 rounded-full bg-lime" /> Local</span>
      </div>
      <form onSubmit={e => { e.preventDefault(); run(); }}>
        <label className="label mt-3 mb-1.5 block" htmlFor="play-input">Input</label>
        <textarea id="play-input" rows={2} maxLength={8192} spellCheck={false} autoCapitalize="off" className={`${styles.input} field`}
          value={draft} onChange={e => setDrafts({ ...drafts, [mode]: e.target.value })} aria-invalid={invalid} aria-describedby={invalid ? "play-error" : undefined}
          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) { e.preventDefault(); run(); } }} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span id="play-output-label" className="label">Output</span>
          <button className={styles.run} type="submit"><Glyph name="play" size={11} />Run tool</button>
        </div>
        <div tabIndex={0} role="group" aria-labelledby="play-output-label" className={styles.result}>
          {dirty ? <p className="text-faint">Run the tool to update the output.</p> : invalid ? <p id="play-error" role="alert" className="text-amber">Invalid JSON. Check the quotes, commas and brackets, then run again.</p>
            : <pre key={`${mode}:${runs}`} className={styles.print}><code>{mode === "JSON" ? output.split(/("(?:[^"\\]|\\.)*"\s*:)/g).map((text, i) => i % 2 ? <span className="text-cyan" key={i}>{text}</span> : text) : output || "(empty output)"}</code></pre>}
        </div>
        <span role="status" className="sr-only">{!dirty && !invalid && runs > 0 ? `Run ${runs} complete. Output ready.` : ""}</span>
      </form>
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 sm:px-5">
      <Link href={`/tools/${modes[mode].slug}`} className="arrow-link text-xs text-muted hover:text-fg">Full workbench <Glyph name="external" size={13} /></Link>
      <CopyButton value={dirty || invalid ? "" : output} label="Copy output" />
    </div>
  </section>;
}
