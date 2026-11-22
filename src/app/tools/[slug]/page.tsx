import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { Glyph } from "@/components/glyph";
import { SaveTool } from "@/components/saved-tools";
import { Workbench } from "@/components/workbench";
import { toolExamples } from "@/lib/tool-examples";
import { allTools, getCategory, getTool, liveTools } from "@/lib/tools";

type Props = PageProps<"/tools/[slug]">;
export function generateStaticParams() { return allTools.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return { title: "Tool not found" };
  return { title: tool.name, description: tool.tagline, alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: { title: `${tool.name} · Toolzync`, description: tool.tagline } };
}

export default async function ToolPage({ params }: Props) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const { name, slug, category } = tool;
  const kind = tool.live ? tool.kind : undefined;
  const related = liveTools.filter(t => t.slug !== slug).sort((a, b) => Number(b.category === category) - Number(a.category === category)).slice(0, 3);
  const snippet = kind ? `curl https://api.toolzync.com/v1/${slug} \\\n  -H "Authorization: Bearer $TOOLZYNC_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(toolExamples[kind])}'` : "";

  return <div className="shell py-8 sm:py-11">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <Link href="/tools" className="hover:text-lime">Tool library</Link><span aria-hidden="true">/</span>
      <Link href={`/tools?category=${category}${kind ? "" : "&view=roadmap"}`} className="hover:text-lime">{getCategory(category)?.name}</Link>
    </nav>
    <div className="reveal mt-5 mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0"><p className="eyebrow"><span className="index-tag">{kind ? "Live" : "Planned"}</span>{kind ? "Browser + API" : "Roadmap"}</p>
        <h1 className="section-title mt-3">{name}</h1><p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{tool.tagline}</p>
      </div>
      {kind && <SaveTool tool={{ name, slug }} />}
    </div>
    {kind ? <>
      <Workbench key={slug} kind={kind} slug={slug} />
      <section id="api-example" aria-labelledby="api-heading" className="card mt-5 grid gap-5 p-5 md:grid-cols-[.85fr_1.15fr]">
        <div><p className="eyebrow"><Glyph name="terminal" /> API example</p><h2 id="api-heading" className="mt-2 text-xl font-medium tracking-tight">Use it in a script</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">Set <code>TOOLZYNC_KEY</code> in your environment and run this request. Testing locally? Use your local server URL in place of the API domain.</p>
          <div className="mt-4 flex gap-4 text-sm"><Link href="/dashboard" className="text-lime hover:underline">Get a key →</Link><Link href="/docs#auth" className="text-muted hover:text-fg">Authentication</Link></div>
        </div>
        <div className="min-w-0 rounded-lg border border-line bg-ink p-3"><div className="flex items-center justify-between gap-2"><span className="label">cURL · example input</span><CopyButton value={snippet} label="Copy cURL" /></div>
          <pre tabIndex={0} role="group" aria-label="Example request" className="mt-3 overflow-x-auto pb-2 font-mono text-xs leading-relaxed"><code>{snippet}</code></pre>
        </div>
      </section>
    </> : <section className="card p-6 sm:p-8"><p className="eyebrow"><Glyph name="layers" /> Roadmap item</p>
      <h2 className="mt-3 text-2xl font-medium tracking-tight">This tool is planned.</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">There’s no workbench or API endpoint to run yet. You can try a live tool now or tell us what you need this one to do.</p>
      <div className="mt-5 flex flex-wrap gap-2"><Link href="/tools" className="btn btn-primary">Browse live tools <Glyph name="arrow" /></Link><Link href={`/contact-sales?tool=${slug}`} className="btn btn-ghost">Request this tool</Link></div>
    </section>}
    <aside aria-label="More live tools" className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"><span className="label">More live tools</span>
      {related.map(r => <Link key={r.slug} href={`/tools/${r.slug}`} className="arrow-link py-1 text-sm text-muted hover:text-lime">{r.name}<Glyph name="external" size={12} /></Link>)}
    </aside>
  </div>;
}
