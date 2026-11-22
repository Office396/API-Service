import type { Metadata } from "next";
import Link from "next/link";
import { PlanPicker } from "@/components/plan-picker";
import { Glyph } from "@/components/glyph";
import { plans, planLink } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing", description: "Compare Toolzync's free API tier and higher-volume plans. Find a plan by monthly request volume." };

export default function PricingPage() {
  return <div className="shell space-y-8 py-10 sm:py-14">
    <div className="reveal"><p className="eyebrow"><span className="index-tag">TZ</span> Pricing</p>
      <h1 className="section-title mt-3">Start free. Scale by request.</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">Browser tools are free without an account. A free API key includes 1,000 successful calls per month. For higher limits, send a plan enquiry.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{plans.map(plan => <article key={plan.id} className={`card flex flex-col p-5 ${plan.id === "free" ? "border-lime/45" : ""}`}>
      <p className="label">{plan.id === "free" ? "Available now" : "By enquiry"}</p><h2 className="mt-2 text-xl font-medium">{plan.name}</h2>
      <p className="mt-3 text-4xl font-medium tracking-tight">{plan.price}{plan.requests !== null && <span className="ml-1 text-xs font-normal tracking-normal text-muted">/ month</span>}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{plan.note}</p>
      <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-muted">{[plan.requests ? `${plan.requests.toLocaleString("en-US")} API calls / month` : "Custom monthly volume", plan.keys, plan.burst].map(line => <li key={line} className="flex items-center gap-2"><Glyph name="check" size={13} className="text-lime" />{line}</li>)}</ul>
      <Link className={`btn mt-5 ${plan.id === "free" ? "btn-primary" : "btn-ghost"}`} href={planLink(plan.id)}>{plan.id === "free" ? "Create a free key" : `Enquire about ${plan.name}`}</Link>
    </article>)}</div>
    <PlanPicker />
    <div className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
      <div><h3 className="font-medium">What happens at the free limit?</h3><p className="mt-2 text-sm leading-relaxed text-muted">The API returns a 429 response with the reset time. There is no automatic charge. Your monthly allowance resets on the first day of each month at 00:00 UTC.</p></div>
      <div><h3 className="font-medium">How do paid plans work?</h3><p className="mt-2 text-sm leading-relaxed text-muted">Contact sales to confirm volume, features, and overage terms before activation. Sending an enquiry leaves your current plan and limits unchanged.</p></div>
    </div>
  </div>;
}
