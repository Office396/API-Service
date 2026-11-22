import type { Metadata } from "next";
import Link from "next/link";
import { categories, liveTools, toolsIn } from "@/lib/tools";

export const metadata: Metadata = {
  title: "API reference",
  description:
    "Complete Toolzync endpoint index across documents, images, media, text, dev, SEO, security, commerce and AI tools.",
};

export default function ApiIndexPage() {
  return (
    <div className="shell py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="eyebrow"><span className="index-tag">V1</span> API reference</p>
          <h1 className="section-title mt-3">
            Endpoint index
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
            {liveTools.length} live endpoints. Open a tool for its workbench and a ready-to-run request. For authentication and limits, see{" "}
            <Link href="/docs" className="text-cyan hover:underline">
              /docs
            </Link>
            .
          </p>
        </div>
        <div className="card px-4 py-3 font-mono text-[10.5px] text-faint">
          base url · <span className="text-fg">https://api.toolzync.com</span>
          <br />
          method · <span className="text-muted">POST · JSON</span>
        </div>
      </div>

      <div className="mt-9 space-y-4">
        {categories.map((category) => {
          const tools = toolsIn(category.slug).filter(tool => tool.live);
          if (tools.length === 0) return null;

          return (
            <section key={category.slug} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-[13.5px] font-medium">{category.name}</h2>
                  <span className="font-mono text-[10px] text-faint">{category.slug}</span>
                </div>
                <span className="font-mono text-[10px] text-faint">
                   {tools.length} live
                </span>
              </div>
              <ul className="divide-y divide-line">
                {tools.map((tool) => (
                  <li
                    key={tool.slug}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5"
                  >
                    <span className="w-10 shrink-0 font-mono text-[10px] uppercase text-faint">
                      post
                    </span>
                    <Link
                      href={`/tools/${tool.slug}#api-example`}
                      className="font-mono text-[12px] text-fg hover:text-lime"
                    >
                      /v1/{tool.slug}
                    </Link>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-muted">
                      {tool.name} — {tool.tagline}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                        tool.live ? "text-lime" : "text-faint"
                      }`}
                    >
                      {tool.live ? "live" : "queued"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Link href="/tools?view=roadmap" className="btn btn-ghost mt-6">View planned tools →</Link>
    </div>
  );
}
