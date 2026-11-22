"use client";

import { Glyph } from "./glyph";

const types = { json: "application/json", csv: "text/csv", txt: "text/plain", css: "text/css" } as const;

export function DownloadButton({ value, filename }: { value: string; filename: string }) {
  const ext = filename.split(".").pop() as keyof typeof types;
  return <button type="button" className="result-action disabled:opacity-50" disabled={!value} aria-label={`Download ${ext.toUpperCase()}`} onClick={() => {
    const href = URL.createObjectURL(new Blob([value], { type: `${types[ext] ?? types.txt};charset=utf-8` }));
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }}><Glyph name="download" size={13} />Download</button>;
}
