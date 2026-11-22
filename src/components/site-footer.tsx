import Link from "next/link";
import { Brand } from "./brand";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/tools", label: "All tools" },
      { href: "/tools?view=saved", label: "Saved tools" },
      { href: "/docs/api", label: "API reference" },
      { href: "/pricing", label: "Pricing" },
      { href: "/dashboard", label: "API keys" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs#quickstart", label: "Quickstart" },
      { href: "/docs#limits", label: "Rate limits" },
      { href: "/docs#errors", label: "Error codes" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact-sales", label: "Contact sales" },
      { href: "/pricing", label: "Enterprise" },
      { href: "/legal/security", label: "Security" },
      { href: "/legal/dpa", label: "DPA" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/aup", label: "Acceptable use" },
      { href: "/legal/sla", label: "SLA" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-surface/60">
      <div className="shell grid gap-12 py-14 md:grid-cols-[1.4fr_2fr]">
        <div>
          <Link href="/" className="inline-flex" aria-label="Toolzync home">
            <Brand />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            A workbench for everyday development. Use a tool in your browser, then take it into a script with one API key.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Link href="/tools?view=roadmap" className="text-sm text-lime hover:underline">Explore the roadmap →</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="label mb-3">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-muted transition hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-faint">
            © 2026 Toolzync Labs. All rights reserved.
          </p>
          <a href="#main" className="font-mono text-[11px] text-muted hover:text-lime">Back to content ↑</a>
        </div>
      </div>
    </footer>
  );
}
