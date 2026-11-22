"use client";

import Link from "next/link";
import { useState } from "react";
import { plans, planLink } from "@/lib/plans";
import { Glyph } from "./glyph";

export function PlanPicker() {
  const [calls, setCalls] = useState("1000");
  const volume = Number(calls);
  const plan = calls.trim() && Number.isSafeInteger(volume) && volume >= 0 ? plans.find(p => p.requests === null || volume <= p.requests) : undefined;
  return <section aria-labelledby="picker-heading" className="card grid items-center gap-5 p-5 sm:p-7 md:grid-cols-[1fr_.85fr_1fr]">
    <div><p className="eyebrow"><Glyph name="layers" /> Plan finder</p><h2 id="picker-heading" className="mt-2 text-xl font-medium tracking-tight">How many calls do you make?</h2><p className="mt-1 text-sm text-muted">Count API calls only. Browser tools are unmetered.</p></div>
    <label><span className="label">Monthly API requests</span><input type="number" min="0" step="1" inputMode="numeric" className="field mt-1.5" value={calls} onChange={e => setCalls(e.target.value)} /></label>
    <div className="min-h-20 border-l-2 border-lime/50 pl-4"><p role="status" className="text-base font-medium">{plan ? `Suggested plan: ${plan.name}` : "Enter a whole number of requests."}</p>
      {plan && <><p className="mt-1 text-xs text-muted">{plan.requests ? `${plan.requests.toLocaleString("en-US")} calls included per month` : "Set a custom volume with sales"}</p>
        <Link href={planLink(plan.id)} className="arrow-link mt-2 text-sm text-lime">{plan.id === "free" ? "Get a free key" : `Ask about ${plan.name}`}<Glyph name="arrow" size={14} /></Link></>}
    </div>
  </section>;
}
