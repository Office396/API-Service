import Link from "next/link";
import { RequestJourney } from "@/components/request-journey";
import { Glyph } from "@/components/glyph";
import { HomePlayground } from "@/components/home-playground";
import { liveTools } from "@/lib/tools";
import styles from "./home.module.css";

const picks = [
  { slug: "json-formatter", title: "Format JSON", category: "Data", copy: "Turn a one-line payload into readable JSON. Sort its keys or download the result.", art: "json" },
  { slug: "color-palette", title: "Build a color palette", category: "Design", copy: "Start with one hex color. Get eleven shades and check their contrast against black and white.", art: "palette" },
  { slug: "meta-tag-generator", title: "Prepare a link preview", category: "Publishing", copy: "Write a title and description once. Get the canonical, Open Graph and social tags for your page.", art: "tags" },
] as const;

function Plate({ kind }: { kind: (typeof picks)[number]["art"] }) {
  return <div aria-hidden="true" className={`${styles.plate} ${styles[kind]}`}>
    {kind === "json" ? <div className={styles.braces}>{"{"}<span><i /><i /><i /></span>{"}"}</div>
      : kind === "palette" ? <div className={styles.swatches}>{["#286b60", "#439580", "#61b69a", "#91d2b6", "#bae8cb"].map(color => <i key={color} style={{ backgroundColor: color }} />)}</div>
      : <div className={styles.metaArt}><span>&lt;head&gt;</span><strong>og:title</strong><span>&lt;/head&gt;</span></div>}
  </div>;
}

export default function HomePage() {
  return <>
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={`shell ${styles.split}`}>
        <div className="reveal min-w-0">
          <p className="eyebrow"><span className="index-tag">V1</span> The developer workbench</p>
          <h1 id="home-title" className={styles.headline}>Messy input.<br /><em>Clean output.</em></h1>
          <p className={styles.lede}>Format a payload, encode a string, or build a color palette. Run tools right in your browser, then use the same ones in your code.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/tools" className="btn btn-primary min-h-11">Explore tools <Glyph name="arrow" /></Link><a href="#request-path" className="btn btn-ghost min-h-11">Follow a request <span aria-hidden="true">↓</span></a></div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted"><Glyph name="shield" size={15} className="text-lime" /> Browser tools are free. No sign-in or upload.</p>
        </div>
        <div className="reveal min-w-0 [animation-delay:80ms]"><HomePlayground /></div>
      </div>
    </section>
    <div className="border-y border-line bg-surface/70">
      <div className={`shell ${styles.strip}`}>
        <Link href="/tools"><strong>{liveTools.length}</strong><span>Live workbenches</span></Link>
        <Link href="/pricing"><strong>1,000</strong><span>Free API calls / month</span></Link>
        <Link href="/tools?view=saved"><Glyph name="bookmark" size={21} /><span>Your saved tools</span><Glyph name="arrow" size={14} /></Link>
      </div>
    </div>

    <RequestJourney />
    <section className="shell py-12 sm:py-16" id="popular" aria-labelledby="picks-title">
      <div className="scroll-in flex flex-wrap items-end justify-between gap-5">
        <div><p className="eyebrow"><span className="index-tag">02</span> Workbench picks</p><h2 id="picks-title" className="section-title mt-3">What are you working on?</h2></div>
        <Link href="/tools" className="arrow-link py-1 text-sm">See all tools <Glyph name="arrow" /></Link>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {picks.map((pick, i) => <Link href={`/tools/${pick.slug}`} key={pick.slug} className={`${styles.pick} card card-hover group min-w-0 overflow-hidden`}>
          <Plate kind={pick.art} />
          <div className="p-5"><p className="label">0{i + 1} / {pick.category}</p>
            <h3 className="mt-2 flex items-center justify-between gap-2 text-xl font-medium tracking-tight">{pick.title}<Glyph name="external" size={18} /></h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{pick.copy}</p>
          </div>
        </Link>)}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
        <span className="label">Quick open</span>{[["Hash", "hash-generator"], ["UUID", "uuid-generator"], ["Base64", "base64"], ["JSON to CSV", "json-to-csv"], ["Cron", "cron-parser"]].map(([name, slug]) => <Link href={`/tools/${slug}`} className="arrow-link py-1 text-sm text-muted hover:text-lime" key={slug}>{name}<Glyph name="external" size={12} /></Link>)}
      </div>
    </section>

    <section id="faq" className="shell grid gap-7 pt-12 pb-5 sm:pt-16 lg:grid-cols-[.85fr_1.15fr]" aria-labelledby="faq-title">
      <div><p className="eyebrow"><span className="index-tag">03</span> Good to know</p><h2 id="faq-title" className="section-title mt-3">Quick answers.</h2></div>
      <div className="divide-y divide-line border-y border-line">
        {[["Does my input leave the browser?", "When you use a browser workbench, the transformation happens in this tab. The API is separate: your script sends a request to the server when you call an endpoint."],
          ["Where are my saved tools?", "Use the bookmark on a tool, then open Saved in the tool library. Only tool names are saved on this browser; your inputs and results are not saved with them."],
          ["What counts toward the free quota?", "Only successful API calls count toward the 1,000 monthly requests shared by your account. Using a browser tool does not use any of that quota."]].map(([q, a]) => <details key={q} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">{q}<span aria-hidden="true" className="font-mono text-xl text-lime transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{a}</p></details>)}
      </div>
    </section>
  </>;
}
