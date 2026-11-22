import Link from "next/link";
import { getCategory, type CategorySlug, type Tool } from "@/lib/tools";
import { SaveButton } from "./saved-tools";
import { Glyph } from "./glyph";

const paths: Record<CategorySlug, string> = {
  documents: "M8 3h6l4 4v14H8zM14 3v5h4",
  images: "M4 17l4.5-5 3 3.5L15 11l5 6M4 7h16v12H4z",
  media: "M9 7l8 5-8 5zM4 4h16v16H4z",
  text: "M5 7h14M5 12h14M5 17h9",
  dev: "M9 8l-4 4 4 4M15 8l4 4-4 4",
  seo: "M11 4a7 7 0 105.2 11.8L21 20M11 4v0",
  security: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z",
  commerce: "M5 8h14l-1.2 12H6.2zM9 8V6a3 3 0 016 0v2",
  ai: "M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4zM18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z",
};

export function CategoryGlyph({ category, className = "" }: { category: CategorySlug; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d={paths[category]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ToolCard({ tool, saved }: { tool: Tool; saved: boolean }) {
  return (
    <article className="card card-hover group flex min-w-0 flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs text-muted"><CategoryGlyph category={tool.category} className="size-5 text-cyan" />{getCategory(tool.category)?.name}</span>
        {tool.live ? <SaveButton tool={tool} saved={saved} compact /> : <span className="chip">Planned</span>}
      </div>
      <h2 className="mt-4 text-lg font-medium tracking-tight"><Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0 after:rounded-[15px] hover:text-lime">{tool.name}</Link></h2>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{tool.tagline}</p>
      <span aria-hidden="true" className="mt-5 flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-faint group-hover:text-lime">{tool.live ? "Open workbench" : "View roadmap item"}<Glyph name="external" size={14} /></span>
    </article>
  );
}
