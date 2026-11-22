import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Section = { heading: string; body: string[] };
type Doc = { title: string; intro: string; sections: Section[] };

const updated = "17 November 2026";

const docs: Record<string, Doc> = {
  terms: {
    title: "Terms of service",
    intro:
      "These terms cover your use of the Toolzync website, browser workbenches and HTTP API. By creating a key or using a workbench you accept them.",
    sections: [
      {
        heading: "1. The service",
        body: [
          "Toolzync provides deterministic text, data and file utilities through a web interface and a metered API. The service is offered as-is during the v1 public beta. Features and endpoints may change with notice, but no /v1 endpoint will change its documented response shape.",
          "Web workbenches run in your browser and are free without an account. API access requires a key and is subject to the quota of your plan.",
        ],
      },
      {
        heading: "2. Acceptable use",
        body: [
          "You may not use Toolzync to process content you have no right to process, to attempt to exceed your quota, to probe or overload infrastructure, or to resell raw API access as a materially identical competing service.",
          "Automated scraping of the marketing site is permitted within reason; denial-of-service behaviour is not. The acceptable use policy forms part of these terms.",
        ],
      },
      {
        heading: "3. Accounts and keys",
        body: [
          "You are responsible for the confidentiality of API keys and for all activity under them. Keys are shown once and stored as SHA-256 digests. Revoke a key immediately if you believe it leaked.",
          "We may suspend a key that is causing abuse, with notice where practical and always with an explanation.",
        ],
      },
      {
        heading: "4. Billing",
        body: [
          "Paid plans are billed in advance, monthly or annually. Overage is billed at the published rate and is capped at the ceiling of the plan you selected unless you explicitly raise it.",
          "Cancellations take effect at the end of the paid period. We do not pro-rate partial months, but unused committed volume rolls over for 30 days on annual contracts.",
        ],
      },
      {
        heading: "5. Availability and support",
        body: [
          "We target 99.9% monthly availability outside announced maintenance. Enterprise plans carry the SLA published separately. Support response targets are best-effort on Free and contractual on Enterprise.",
        ],
      },
      {
        heading: "6. Liability",
        body: [
          "To the maximum extent permitted by law, Toolzync is not liable for indirect or consequential loss, and total liability is limited to the greater of fees paid in the twelve months before the claim or USD 100.",
          "Nothing in these terms limits liability that cannot be limited by law.",
        ],
      },
      {
        heading: "7. Changes and governing law",
        body: [
          "We will give 30 days' notice of material changes to these terms by email to key owners. Continued use after the effective date constitutes acceptance.",
          "These terms are governed by the laws of the jurisdiction stated in your order form, or Delaware, USA, where no order form applies.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro:
      "This policy explains what Toolzync collects, why, and how long it is kept. The short version: workbench inputs never leave your browser, and API payloads are not retained.",
    sections: [
      {
        heading: "What we do not collect",
        body: [
          "Inputs typed into browser workbenches are processed locally and never transmitted. API request bodies are processed in memory to produce the response and are not written to disk, logged or used for training.",
          "We do not sell personal data, and we do not run advertising trackers on this site.",
        ],
      },
      {
        heading: "What we do collect",
        body: [
          "Account data: your name, email address, password hash and the session records needed to sign you in. An HTTP-only cookie identifies your session.",
          "Operational data: request metadata (timestamp, endpoint, status code, latency, key id, truncated request id) for quota enforcement and abuse prevention. Metadata is retained for 30 days.",
          "Site analytics: aggregated, cookie-free page views. No cross-site identifiers.",
        ],
      },
      {
        heading: "Legal bases",
        body: [
          "We process account data to perform our contract with you, operational data for our legitimate interest in running a secure and billable service, and marketing email only with consent you can withdraw at any time.",
        ],
      },
      {
        heading: "Subprocessors",
        body: [
          "Hosting and CDN: Vercel. Payments: Stripe. Transactional email: Resend. Error monitoring: Sentry (metadata only, PII scrubbed). The current list, with regions, is available on request and is included in the DPA.",
        ],
      },
      {
        heading: "Retention and deletion",
        body: [
          "Request metadata: 30 days. Billing records: as required by tax law (typically 7 years). Account data: deleted within 30 days of a verified request, except records we must retain by law.",
          "To request export or deletion, email privacy@toolzync.com from the address on the account.",
        ],
      },
      {
        heading: "International transfers",
        body: [
          "Data is processed in the EU and US. Where personal data leaves the EEA, we rely on Standard Contractual Clauses and the UK Addendum. Enterprise customers can request regional routing.",
        ],
      },
    ],
  },
  aup: {
    title: "Acceptable use policy",
    intro:
      "This policy keeps the service fast and lawful for everyone. It applies to the website, workbenches and API.",
    sections: [
      {
        heading: "Prohibited content",
        body: [
          "Do not process material that is unlawful in your jurisdiction, including child sexual abuse material, credible threats, or content infringing third-party rights. Do not use AI-assisted tools to generate such material.",
        ],
      },
      {
        heading: "Prohibited behaviour",
        body: [
          "No attempts to bypass authentication, quotas or rate limits; no credential stuffing; no automated vulnerability scanning of our infrastructure without written authorisation; no reselling of raw API capacity as a competing utility API.",
          "No using the service to build malware, phishing infrastructure, or bulk unsolicited messaging.",
        ],
      },
      {
        heading: "Fair use of shared capacity",
        body: [
          "Sustained bursts above your plan's per-minute limit may be throttled. If your workload needs sustained throughput, contact sales for a dedicated allocation rather than rotating keys.",
        ],
      },
      {
        heading: "Enforcement",
        body: [
          "We may throttle, suspend or terminate access for violations, with notice where practical. Serious violations (for example, CSAM or active attacks) result in immediate suspension and, where required, referral to authorities.",
          "Appeals go to abuse@toolzync.com and receive a human response within five business days.",
        ],
      },
    ],
  },
  sla: {
    title: "Service level agreement",
    intro:
      "This SLA applies to Enterprise plans and describes the availability commitment, measurement and credits.",
    sections: [
      {
        heading: "Commitment",
        body: [
          "Toolzync targets 99.95% monthly availability for the /v1 API, measured per calendar month, excluding scheduled maintenance announced at least 72 hours in advance and events outside our reasonable control.",
        ],
      },
      {
        heading: "Measurement",
        body: [
          "Availability is calculated from our external synthetic monitors, which probe a representative endpoint from three regions every 60 seconds. A minute is unavailable if all probes from all regions fail.",
          "The dashboard at /dashboard reports the current month's measurement. Enterprise customers receive monthly reports.",
        ],
      },
      {
        heading: "Credits",
        body: [
          "Below 99.95%: 10% of the monthly fee. Below 99.5%: 25%. Below 99.0%: 50%. Credits are applied to the next invoice and are the sole remedy for availability shortfall.",
          "Claims must be submitted within 30 days of the affected month with the affected request ids.",
        ],
      },
      {
        heading: "Exclusions",
        body: [
          "Excluded: customer-side failures, invalid requests (4xx other than 429), quota exhaustion, force majeure, and beta endpoints explicitly marked as such.",
        ],
      },
    ],
  },
  security: {
    title: "Security",
    intro:
      "How Toolzync protects keys, data and infrastructure — and what we can hand your security team today.",
    sections: [
      {
        heading: "Key handling",
        body: [
          "Keys contain 192 random bits. The full key is shown only at creation; the service stores its SHA-256 digest and a short display prefix.",
          "Only the signed-in account can manage its keys. To rotate, create a replacement, switch your application to it, and revoke the old key. Revocation is immediate.",
        ],
      },
      {
        heading: "Data handling",
        body: [
          "Request bodies are processed in memory and dropped after the response. We do not log payloads. Error monitoring receives metadata and error messages with user input scrubbed.",
          "TLS 1.2+ everywhere, HSTS with preload, strict transport and content-security headers on the site.",
        ],
      },
      {
        heading: "Infrastructure",
        body: [
          "The account service runs on Node.js and uses persistent storage for accounts, sessions, key digests and usage counters.",
          "Dependencies are pinned, scanned on every build, and patched on a 7-day SLA for high-severity advisories.",
        ],
      },
      {
        heading: "Compliance posture",
        body: [
          "SOC 2 Type II is in progress; the readiness assessment is available under NDA. We maintain a DPA with SCCs, a subprocessor register, and an annual third-party penetration test whose summary is shared with Enterprise customers.",
        ],
      },
      {
        heading: "Reporting a vulnerability",
        body: [
          "Email security@toolzync.com with steps to reproduce. We acknowledge within one business day, do not pursue good-faith researchers, and credit reporters who want it. Please do not test against other customers' data.",
        ],
      },
    ],
  },
  dpa: {
    title: "Data processing addendum",
    intro:
      "This DPA applies where Toolzync processes personal data on your behalf. It is incorporated into the agreement by reference and supersedes conflicting terms about processing.",
    sections: [
      {
        heading: "Roles and scope",
        body: [
          "You are the controller and Toolzync is the processor for personal data contained in API requests. Processing is limited to transmitting, transforming and returning that data as instructed by your API calls.",
          "Toolzync acts as an independent controller for account, billing and security metadata.",
        ],
      },
      {
        heading: "Processor obligations",
        body: [
          "We process personal data only on documented instructions, ensure personnel are bound by confidentiality, implement the technical and organisational measures described in the Security page, and assist with data subject requests to the extent technically feasible.",
          "We notify you without undue delay, and within 72 hours where feasible, after becoming aware of a personal data breach affecting your data.",
        ],
      },
      {
        heading: "Subprocessors",
        body: [
          "You authorise the subprocessors listed in the privacy policy. We give 30 days' notice of new subprocessors and you may object on reasonable data-protection grounds; if we cannot resolve the objection, you may terminate the affected services and receive a pro-rated refund.",
        ],
      },
      {
        heading: "Transfers and security",
        body: [
          "International transfers rely on the 2021 Standard Contractual Clauses and the UK Addendum. Enterprise customers may select EU-only processing, in which case no request bodies are routed outside the EEA.",
        ],
      },
      {
        heading: "Audit and deletion",
        body: [
          "Once per year you may audit our compliance using a written questionnaire or the latest third-party report; on-site audits require 30 days' notice and confidentiality. On termination we delete or return personal data within 30 days, except where retention is required by law.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(docs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = docs[slug];
  if (!doc) return { title: "Not found" };
  return { title: doc.title, description: doc.intro };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = docs[slug];
  if (!doc) notFound();

  return (
    <div className="shell py-12">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="label">legal</p>
          <ul className="mt-3 space-y-1 border-l border-line pl-3">
            {Object.entries(docs).map(([key, value]) => (
              <li key={key}>
                <Link
                  href={`/legal/${key}`}
                  className={`font-mono text-[11px] transition ${
                    key === slug ? "text-lime" : "text-faint hover:text-fg"
                  }`}
                >
                  {value.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="card mt-5 p-4">
            <p className="label">status</p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Working draft. Counsel review is scheduled before v1 GA; Enterprise riders are
              negotiated separately.
            </p>
          </div>
        </aside>

        <article className="prose-shell max-w-2xl min-w-0">
          <p className="label !text-cyan">last updated {updated}</p>
          <h1 className="!mt-2 text-[30px] font-semibold tracking-[-0.025em] sm:text-[36px]">
            {doc.title}
          </h1>
          <p className="!mt-3 text-[14px] leading-relaxed text-muted">{doc.intro}</p>
          <div className="mt-8 space-y-8">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
          <div className="card !p-5 mt-10">
            <p className="label">questions</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              legal@toolzync.com for contracts, privacy@toolzync.com for data requests,
              security@toolzync.com for vulnerability reports.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
