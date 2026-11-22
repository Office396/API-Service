"use client";

import { useState } from "react";
import { buildMetaTags, metaExample, type MetaFields } from "@/lib/meta-tags";
import { CopyButton } from "./copy-button";

export function MetaWorkbench() {
  const [fields, setFields] = useState<MetaFields>(metaExample);
  const result = buildMetaTags(fields);
  const settings = [
    ["title", "Page title", 200], ["description", "Description", 500],
    ["url", "Canonical URL", 2048], ["image", "Image URL (optional)", 2048],
  ] as const;

  return <div className="grid min-w-0 gap-5 md:grid-cols-2">
    <div className="space-y-3">
      {settings.map(([field, label, maxLength]) => {
        const invalid = !result.ok && result.field === field;
        const props = { id: `meta-${field}`, value: fields[field], maxLength, "aria-invalid": invalid,
          "aria-describedby": invalid ? "meta-error" : undefined, className: "field mt-1.5",
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields({ ...fields, [field]: e.target.value }) };
        return <div key={field}><label className="label" htmlFor={props.id}>{label}</label>
          {field === "description" ? <textarea {...props} rows={3} /> : <input {...props} type={field === "title" ? "text" : "url"} placeholder={field === "image" ? "https://example.com/cover.jpg" : undefined} />}
        </div>;
      })}
      <p className="text-xs leading-relaxed text-muted">This is a text preview. Neither URL is fetched.</p>
    </div>
    <div className="min-w-0">
      {result.ok ? <>
        <p className="label mb-2">Link preview</p>
        <div className="overflow-hidden rounded-lg border border-line bg-raised p-4 [overflow-wrap:anywhere]">
          <p className="font-mono text-xs text-cyan">{result.data.host}</p><p className="mt-2 text-lg font-medium">{fields.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{fields.description}</p>
        </div>
        <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-2"><span className="label">Paste in &lt;head&gt;</span><CopyButton value={result.data.html} label="Copy tags" /></div>
        <pre tabIndex={0} role="group" aria-label="Generated HTML tags" className="max-h-52 overflow-auto rounded-lg border border-line bg-ink p-3 font-mono text-xs leading-relaxed"><code>{result.data.html}</code></pre>
      </> : <p id="meta-error" role="alert" className="rounded-lg border border-amber/35 bg-amber/5 p-4 text-sm text-amber">{result.message}</p>}
    </div>
  </div>;
}
