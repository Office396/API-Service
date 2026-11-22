"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { slugify } from "@/lib/engines";
import { CopyButton } from "./copy-button";
import { Glyph } from "./glyph";
import styles from "./request-journey.module.css";

const chapters = [
  { tab: "Input", title: "Start with a title.", copy: "Choose a sample, or open the workbench and paste your own page title. The browser runs it locally.", link: "/tools/slug-generator", action: "Try your own title" },
  { tab: "Transform", title: "Normalize the text.", copy: "Watch accents, spaces and punctuation become a lowercase, URL-friendly slug. This is the output of the same function the API uses.", link: "/tools/slug-generator", action: "Open the slug generator" },
  { tab: "API request", title: "Call it from a script.", copy: "Send the title to the endpoint with your API key. Read the slug from the response, then check the successful call in your dashboard.", link: "/dashboard", action: "Get an API key" },
] as const;

const samples = ["Friday release notes", "Café menu · Spring", "Design system: version 2"];
const scrollMode = "(min-width: 900px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)";
const ordinal = (i: number) => String(i + 1).padStart(2, "0");

function Circuit() {
  return <svg viewBox="0 0 540 160" className={styles.circuit} aria-hidden="true" focusable="false">
    <g className={styles.traces}>
      {[0, 1, 2, 3].map(i => <g key={i}>
        <path d={`M20 ${20 + i * 11}h${92 - i * 8}l40 34h54M20 ${141 - i * 10}h${67 + i * 6}l40 -28h68`} />
        <path d={`M337 ${57 + i * 6}h${38 - i * 4}l37 -28h108M336 ${97 + i * 5}h${48 - i * 4}l34 25h102`} />
      </g>)}
      <path d="M12 80h516" strokeDasharray="3 4" />
    </g>
    <path className={styles.signalLine} d="M24 80h492" pathLength="1" />
    <g className={styles.packet}><circle cx="24" cy="80" r="10" fill="none" stroke="currentColor" /><circle cx="24" cy="80" r="4.5" fill="currentColor" /></g>
    <g transform="translate(270 86)" stroke="#243b31" strokeLinejoin="round">
      <path d="m-79 18 79-38 79 38-79 38z" fill="#14251e" opacity=".15" stroke="none" />
      <path d="m-76 8 76-37 76 37v9L0 54l-76-37z" fill="#375347" />
      <path d="m-76 8 76-37 76 37L0 45z" fill="#99bca7" />
      <g className={styles.midLayer}>
        <path d="m-71 2 71-35 71 35v7L0 44l-71-35z" fill="#577968" />
        <path d="m-71 2 71-35 71 35L0 37z" fill="#bad8be" />
      </g>
      <g className={styles.topLayer}>
        <path d="m-66-3 66-33 66 33v8L0 38-66 5z" fill="#65886c" />
        <path d="m-66-3 66-33 66 33L0 30z" fill="#d8f39c" />
        <path d="m-54-3 54-27 54 27L0 24z" fill="none" opacity=".55" />
        <g transform="matrix(1,-.5,1,.5,-24,2)" fill="#233c28" stroke="none"><path d="M0-7h31v5H19v17h-6V-2H0zM25 4h6v11h-6z" /></g>
      </g>
    </g>
    <g fill="none" stroke="currentColor"><circle cx="24" cy="80" r="4" /><circle cx="516" cy="80" r="4" /></g>
  </svg>;
}

export function RequestJourney() {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(samples[0]);
  const board = useRef<HTMLElement>(null);
  const markers = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = markers.current, figure = board.current;
    if (!list || !figure || typeof IntersectionObserver === "undefined") return;
    const slides = Array.from(list.children);
    const media = window.matchMedia(scrollMode);
    let inView = false, frame = 0, lastStep = -1;

    function measure() {
      frame = 0;
      const center = window.innerHeight / 2;
      const centers = slides.map(slide => { const r = slide.getBoundingClientRect(); return r.top + r.height / 2; });
      const i = center < centers[1] ? 0 : 1;
      const local = Math.max(0, Math.min(1, (center - centers[i]) / Math.max(1, centers[i + 1] - centers[i])));
      const progress = (i + local) / (slides.length - 1);
      // The diagram scrubs continuously; React only needs the three chapter changes.
      figure!.style.setProperty("--travel", progress.toFixed(4));
      figure!.style.setProperty("--lift", (1 - Math.abs(2 * progress - 1)).toFixed(4));
      const current = Math.round(i + local);
      if (current !== lastStep) { lastStep = current; setStep(current); }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(measure); }
    function detach() {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame); frame = 0;
    }
    function syncMode() {
      detach(); lastStep = -1;
      if (!media.matches) {
        figure!.style.removeProperty("--travel"); figure!.style.removeProperty("--lift");
      } else if (inView) {
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        schedule();
      }
    }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncMode(); });
    observer.observe(list);
    media.addEventListener("change", syncMode);
    return () => { observer.disconnect(); media.removeEventListener("change", syncMode); detach(); };
  }, []);

  function selectStep(i: number) {
    setStep(i);
    if (typeof IntersectionObserver !== "undefined" && window.matchMedia(scrollMode).matches) {
      // An explicit chapter jump uses normal page scrolling; wheel/touch are never intercepted.
      markers.current?.children[i]?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }

  const slug = slugify(title);
  const payload = JSON.stringify({ input: title });
  const curl = `curl https://api.toolzync.com/v1/slug \\\n  -H "Authorization: Bearer $TOOLZYNC_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${payload}'`;
  const readout = [payload, slug, `POST /v1/slug\n${payload}\n\ndata → ${JSON.stringify({ slug })}`][step];

  return <section id="request-path" aria-labelledby="journey-title" className={styles.section}>
    <div className="shell">
      <div className={styles.heading}>
        <div><p className="eyebrow"><span className="index-tag">01</span> The request path</p>
          <h2 id="journey-title" className="section-title mt-3">Follow one request.</h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">Trace a title through the slug generator, from browser input to the JSON you can use in your code.</p>
      </div>
      <div className={styles.layout} data-stage={step}>
        <figure ref={board} className={styles.board}>
          <figcaption className={styles.cap}><span><i aria-hidden="true" /> Signal monitor</span><span>FIG. 01 / 03</span></figcaption>
          <div className={styles.paper}>
            <div className={styles.paperTitle}><span>TZ—01 / SLUG ENGINE</span><span>STEP {ordinal(step)}</span></div>
            <Circuit />
            <div className={styles.legend} aria-hidden="true"><span>IN</span><span>PROCESS</span><span>OUT</span></div>
          </div>
          <div className={styles.controls}>
            <label className={styles.picker}><span className="label">Example title</span>
              <select value={title} onChange={e => setTitle(e.target.value)}>{samples.map(sample => <option key={sample}>{sample}</option>)}</select>
            </label>
            <div role="group" aria-label="Trace stage" className={styles.tabs}>
              {chapters.map((chapter, i) => <button key={chapter.tab} type="button" aria-pressed={step === i} aria-controls="trace-readout" onClick={() => selectStep(i)}>
                <span aria-hidden="true">{ordinal(i)}</span>{chapter.tab}
              </button>)}
            </div>
            <div className={styles.readout}>
              <div className="flex items-center justify-between gap-2"><span className="label">{["Input JSON", "Local output", "Example exchange"][step]}</span>
                <CopyButton value={step === 2 ? curl : readout} label={["Copy JSON", "Copy slug", "Copy cURL"][step]} />
              </div>
              <pre id="trace-readout" role="group" aria-label="Example readout" className={styles.code}><code key={step}>{readout}</code></pre>
            </div>
          </div>
        </figure>
        <ol ref={markers} className={styles.chapters} aria-label="Request walkthrough">
          {chapters.map((chapter, i) => <li key={chapter.tab} data-current={step === i}>
            <p className={styles.kicker}><span>{ordinal(i)}</span> / {chapter.tab}</p>
            <h3>{chapter.title}</h3><p className={styles.description}>{chapter.copy}</p>
            <Link href={chapter.link} className="arrow-link mt-3 text-sm hover:text-lime">{chapter.action}<Glyph name="external" size={13} /></Link>
          </li>)}
        </ol>
      </div>
    </div>
  </section>;
}
