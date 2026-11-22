"use client";

import { useMemo, useSyncExternalStore } from "react";
import { liveTools, type Tool } from "@/lib/tools";
import { Glyph } from "./glyph";

// Only catalogue slugs belong here. Inputs, outputs and account data stay out of this store.
const key = "toolzync:saved-tools:v1";
let memoryOnly: string | undefined;
function snapshot() {
  if (memoryOnly !== undefined) return memoryOnly;
  try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; }
}
function subscribe(change: () => void) {
  const onStorage = (event: StorageEvent) => { if (!event.key || event.key === key) change(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(key, change);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(key, change); };
}
function decode(raw: string): Set<string> {
  const items = raw.split(",");
  return new Set(liveTools.map(tool => tool.slug).filter(slug => items.includes(slug)));
}
export function useSavedTools() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  return useMemo(() => decode(raw), [raw]);
}
function toggle(slug: string) {
  const next = decode(snapshot());
  if (next.has(slug)) next.delete(slug); else next.add(slug);
  const raw = [...next].join(",");
  try { window.localStorage.setItem(key, raw); memoryOnly = undefined; } catch { memoryOnly = raw; }
  window.dispatchEvent(new Event(key));
}
export function SaveButton({ tool, saved, compact = false }: { tool: Pick<Tool, "slug" | "name">; saved: boolean; compact?: boolean }) {
  const label = `${saved ? "Remove" : "Save"} ${tool.name}`;
  return <button type="button" onClick={() => toggle(tool.slug)} aria-label={label} title={label} aria-pressed={saved}
    className={`relative z-10 inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg border text-sm transition-colors ${saved ? "border-lime/40 bg-lime/10 text-lime" : "border-line text-muted hover:border-line-strong hover:text-fg"} ${compact ? "" : "px-3"}`}>
    <Glyph name="bookmark" size={16} className={saved ? "fill-current" : ""} />{!compact && (saved ? "Saved" : "Save tool")}
  </button>;
}
export function SaveTool({ tool }: { tool: Pick<Tool, "slug" | "name"> }) {
  return <SaveButton tool={tool} saved={useSavedTools().has(tool.slug)} />;
}
