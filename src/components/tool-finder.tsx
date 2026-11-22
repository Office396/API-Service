"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getCategory, getTool, popularToolSlugs, searchTools } from "@/lib/tools";
import { Glyph } from "./glyph";

const suggested = popularToolSlugs.flatMap(slug => getTool(slug) ?? []).slice(0, 5);

export function ToolFinder() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const matches = query.trim() ? searchTools(query).filter(tool => tool.live) : suggested;
  const results = matches.slice(0, 7);

  function show(from?: HTMLElement) {
    if (!dialog.current || dialog.current.open) return;
    const focused = document.activeElement;
    returnTo.current = from ?? (focused instanceof HTMLElement && focused !== document.body ? focused : trigger.current);
    dialog.current.showModal();
    setOpen(true);
    input.current?.focus();
  }

  function dismiss() {
    dialog.current?.close();
    returnTo.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !event.altKey && !event.isComposing) {
        event.preventDefault();
        if (dialog.current?.open) dismiss(); else show();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  return <>
    <button ref={trigger} type="button" className="btn btn-ghost min-h-10 px-2.5" onClick={e => show(e.currentTarget)} aria-label="Find a tool" aria-haspopup="dialog" aria-keyshortcuts="Control+k Meta+k">
      <Glyph name="search" /><span className="hidden text-xs xl:inline">Find a tool</span><kbd aria-hidden="true" className="hidden rounded border border-line px-1 text-[10px] text-faint xl:inline">Ctrl / ⌘ K</kbd>
    </button>
    <dialog ref={dialog} className="finder" aria-labelledby="finder-title" onClose={() => { setQuery(""); setOpen(false); }}
      onCancel={e => { e.preventDefault(); dismiss(); }}
      onClick={e => { if (e.target === dialog.current) dismiss(); }}
      onKeyDown={e => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); dismiss(); return; }
        const links = Array.from(list.current?.querySelectorAll("a") ?? []);
        if (!links.length) return;
        const at = links.indexOf(document.activeElement as HTMLAnchorElement);
        if (e.target !== input.current && at < 0) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (e.key === "ArrowUp" && at === 0) input.current?.focus();
          else links[e.key === "ArrowDown" ? (at + 1) % links.length : (at < 0 ? links.length - 1 : at - 1)].focus();
        } else if (e.key === "Enter" && e.target === input.current) { e.preventDefault(); links[0].click(); }
      }}>
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="finder-title" className="text-xl font-semibold tracking-tight">Find a tool</h2>
          <button type="button" className="result-action" onClick={dismiss} aria-label="Close search"><Glyph name="close" /></button>
        </div>
        <input ref={input} type="search" aria-label="Search live tools" placeholder="Try JSON, colour, or a tool name…" className="field" value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
        <p className="label mt-5 mb-2" role="status">{query.trim() ? `${matches.length} live ${matches.length === 1 ? "match" : "matches"}` : "Quick picks"}</p>
        {open && <ul ref={list}>
          {results.map(tool => <li key={tool.slug}><Link href={`/tools/${tool.slug}`} prefetch={false} onClick={() => dialog.current?.close()}
            className="arrow-link flex w-full rounded-md border-b border-line px-2 py-3 text-sm hover:bg-raised focus-visible:bg-raised">
            {tool.name}<span className="ml-auto text-xs text-faint">{getCategory(tool.category)?.name}</span><Glyph name="arrow" size={14} />
          </Link></li>)}
        </ul>}
        {!results.length && <p className="py-4 text-sm text-muted">No live tool matches that search. Try a shorter name or check the roadmap.</p>}
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted">
          <span>↑ ↓ to choose · Enter to open</span>
          <Link className="text-lime hover:underline" href={`/tools${query.trim() ? `?q=${encodeURIComponent(query.trim())}${!matches.length ? "&view=roadmap" : ""}` : ""}`} onClick={() => dialog.current?.close()}>Browse the library →</Link>
        </div>
      </div>
    </dialog>
  </>;
}
