"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { allTools, categories, liveTools, searchTools } from "@/lib/tools";
import { Glyph } from "./glyph";
import { useSavedTools } from "./saved-tools";
import { ToolCard } from "./tool-card";

const views = { live: "Live tools", saved: "Saved", roadmap: "Roadmap" } as const;
type View = keyof typeof views;

function update(filters: Partial<Record<"q" | "category" | "view", string>>, replace = false) {
  const url = new URL(window.location.href);
  for (const [key, val] of Object.entries(filters)) {
    if (!val || (key === "view" && val === "live")) url.searchParams.delete(key);
    else url.searchParams.set(key, val);
  }
  if (url.href === window.location.href) return;
  if (replace) window.history.replaceState(null, "", url); else window.history.pushState(null, "", url);
}

export function ToolBrowser() {
  const params = useSearchParams();
  const viewParam = params.get("view");
  const view: View = viewParam === "saved" || viewParam === "roadmap" ? viewParam : "live";
  const q = params.get("q") ?? "";
  const category = categories.find(c => c.slug === params.get("category"))?.slug ?? "";
  const saved = useSavedTools();
  const input = useRef<HTMLInputElement>(null);
  // Keystrokes update the field immediately. Router snapshots can arrive later;
  // only reconcile an external change (e.g. Back or Clear) to the current URL.
  useEffect(() => {
    const field = input.current;
    if (field && field.value !== q && q === (new URLSearchParams(window.location.search).get("q") ?? "")) {
      field.value = q;
    }
  }, [q]);
  const scope = (tool: typeof allTools[number]) => view === "roadmap" ? !tool.live : view === "saved" ? saved.has(tool.slug) : tool.live;
  const matches = searchTools(q, category);
  const results = matches.filter(scope);
  const sizes = { live: liveTools.length, roadmap: allTools.length - liveTools.length, saved: saved.size };
  const emptyShelf = view === "saved" && !saved.size;
  const hasRoadmapMatches = view === "live" && matches.some(t => !t.live);

  return <div className="mt-7">
    <div className="flex flex-wrap gap-1 border-b border-line" role="group" aria-label="Library view">
      {(Object.keys(views) as View[]).map(v => <button key={v} type="button" aria-pressed={view === v} onClick={() => update({ view: v, category: "" })}
        className={`inline-flex items-center gap-1.5 border-b-2 px-2.5 py-3 text-sm font-medium sm:px-4 ${v === view ? "border-lime text-lime" : "border-transparent text-muted hover:text-fg"}`}>
        {views[v]} <span className="rounded bg-white/5 px-1 font-mono text-[10px]">{sizes[v]}</span></button>)}
    </div>
    <div className="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_210px]">
      <label><span className="label">Search the library</span><span className="relative mt-1.5 block"><Glyph name="search" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
        <input type="search" ref={input} defaultValue={q} onChange={e => update({ q: e.currentTarget.value }, true)} placeholder="Name or task, e.g. format JSON" className="field min-h-11 pl-10" /></span></label>
      <label><span className="label">Category</span><select className="field mt-1.5 min-h-11" value={category} onChange={e => update({ category: e.target.value })}>
        <option value="">All categories</option>{categories.filter(c => c.slug === category || allTools.some(t => t.category === c.slug && scope(t))).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select></label>
    </div>
    <div className="my-4 flex min-h-8 flex-wrap items-center justify-between gap-x-3 text-xs text-muted"><p role="status">{results.length} {results.length === 1 ? "tool" : "tools"} · {view === "saved" ? "Saved on this browser" : view === "roadmap" ? "Planned, not yet available" : "Ready to use"}</p>
      {(q || category) && <button type="button" className="text-lime hover:underline" onClick={() => { update({ q: "", category: "" }); input.current?.focus(); }}>Clear filters</button>}</div>
    {results.length ? <div key={view} className="reveal grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{results.map(tool => <ToolCard key={tool.slug} tool={tool} saved={saved.has(tool.slug)} />)}</div>
      : <div className="card flex flex-col items-center gap-3 border-dashed px-4 py-12 text-center">
        <Glyph name={emptyShelf ? "bookmark" : "search"} size={26} className="text-lime" />
        <h2 className="text-xl font-medium">{emptyShelf ? "Your shelf is empty" : "No matching tools"}</h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted">{emptyShelf ? "Select the bookmark on any live tool to keep it here for next time." : hasRoadmapMatches ? "There are planned tools that match these filters." : "Try a different name or a broader category."}</p>
        <button className="btn btn-ghost mt-1" type="button" onClick={() => hasRoadmapMatches ? update({ view: "roadmap" }) : update({ q: "", category: "", view: emptyShelf ? "live" : view })}>{hasRoadmapMatches ? "See roadmap matches" : emptyShelf ? "Browse live tools" : "Reset filters"}</button>
      </div>}
  </div>;
}
