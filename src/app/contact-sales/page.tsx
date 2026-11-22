import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Suspense } from "react";
import { plans } from "@/lib/plans";
import { getTool } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Enterprise & sales",
  description:
    "Talk to Toolzync about volume pricing, SSO, DPA, uptime SLA, dedicated regions or a tool we have not shipped yet.",
};

type Props = PageProps<"/contact-sales">;
async function Inquiry({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const plan = plans.find(p => p.id !== "free" && p.id === params.plan);
  const tool = typeof params.tool === "string" ? getTool(params.tool) : undefined;
  const topic = plan ? `${plan.name} plan` : tool ? `Tool request: ${tool.name}` : "";
  return <ContactForm key={topic} topic={topic} />;
}

export default function ContactSalesPage({ searchParams }: Props) {
  return (
    <div className="shell py-14">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow"><span className="index-tag">TZ</span> Contact sales</p>
          <h1 className="section-title mt-3">Tell us what you need.</h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-muted">
            Ask about a higher API allowance, a tool on the roadmap, or a security requirement. Include your expected volume and which endpoints you want to use.
          </p>

          <dl className="mt-8 divide-y divide-line border-y border-line">
            {[
               ["Plans", "Volume estimates, invoicing and account limits"],
               ["New tools", "A sample input, expected output and use case"],
               ["Security", "Your data handling and procurement requirements"],
            ].map(([term, value]) => (
              <div key={term} className="flex gap-6 py-3">
                <dt className="w-32 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint">
                  {term}
                </dt>
                <dd className="text-[12.5px] leading-relaxed text-muted">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="card mt-6 p-5">
            <p className="label">prefer email?</p>
            <a href="mailto:sales@toolzync.com" className="mt-2 inline-block font-mono text-[13px] text-lime hover:underline">sales@toolzync.com</a>
            <p className="mt-1 font-mono text-[11px] text-faint">
              security@toolzync.com · privacy@toolzync.com
            </p>
          </div>
        </div>

        <div>
          <Suspense fallback={<p role="status" className="card p-6 text-sm text-muted">Opening enquiry form…</p>}><Inquiry searchParams={searchParams} /></Suspense>
        </div>
      </div>
    </div>
  );
}
