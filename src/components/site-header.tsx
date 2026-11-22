"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Brand } from "./brand";
import { Glyph } from "./glyph";
import { ToolFinder } from "./tool-finder";

const nav = [["/tools", "Tool library"], ["/docs", "API docs"], ["/pricing", "Pricing"]] as const;

export function SiteHeader({ account }: { account: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const links = nav.map(([href, label]) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return <Link key={href} href={href} aria-current={active ? pathname === href ? "page" : "location" : undefined}
      onClick={() => setOpen(false)} className={`rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-raised hover:text-fg ${active ? "bg-raised text-lime" : "text-muted"}`}>{label}</Link>;
  });

  return <header className="sticky top-0 z-50 border-b border-line bg-ink/95 backdrop-blur-md" onKeyDown={e => {
    if (open && e.key === "Escape" && !e.currentTarget.querySelector("dialog[open]")) { setOpen(false); toggle.current?.focus(); }
  }}>
    <div className="shell flex h-16 items-center justify-between gap-3">
      <Link href="/" onClick={() => setOpen(false)} aria-label="Toolzync home"><Brand /></Link>
      <nav aria-label="Primary" className="hidden items-center md:flex">{links}</nav>
      <div className="flex items-center gap-2">
        <ToolFinder />
        <div className="hidden items-center gap-2 md:flex">{account}</div>
        <button type="button" ref={toggle} aria-controls="mobile-nav" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)} className="btn btn-ghost min-h-10 px-2.5 md:hidden"><Glyph name={open ? "close" : "menu"} size={20} /></button>
      </div>
    </div>
    <nav id="mobile-nav" aria-label="Mobile" hidden={!open} className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-xl md:hidden">
      <div className="shell reveal flex flex-col gap-1 py-4">{links}<div className="mt-2 flex gap-2 border-t border-line pt-3 [&>*]:flex-1" onClick={() => setOpen(false)}>{account}</div></div>
    </nav>
  </header>;
}
