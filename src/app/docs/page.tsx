import type { Metadata } from "next";
import Link from "next/link";
import { CodeSample } from "@/components/code-sample";
import { liveTools } from "@/lib/tools";

export const metadata: Metadata = { title: "API docs", description: "Make your first Toolzync request. Learn how to authenticate, read a response, and handle quota and rate limits." };
const sections = [["quickstart", "Quickstart"], ["auth", "Authentication"], ["envelope", "Request & response"], ["limits", "Rate limits"], ["errors", "Errors"], ["versioning", "Versioning"]];
const errors = [
  [400, "invalid_json / invalid_input", "Check the JSON body and the named field."],
  [401, "invalid_key", "Send an active account key in a request header."],
  [404, "unknown_tool", "Check the slug against the endpoint index."],
  [405, "Method not allowed", "Use POST for a JSON request."],
  [409, "tool_not_live", "This catalogue item is still on the roadmap."],
  [413, "payload_too_large", "Reduce the body to at most 256 KB."],
  [422, "unprocessable_input", "The body was read but the transform could not process it."],
  [429, "rate_limited / quota_exceeded", "Respect Retry-After. For monthly limits, check x-quota-reset."],
  [500, "internal_error", "If it persists, include the request ID when asking for help."],
] as const;

export default function DocsPage() {
  return <div className="shell py-10 sm:py-12">
    <p className="eyebrow"><span className="index-tag">V1</span> Documentation</p><h1 className="section-title mt-3">Your first API request</h1>
    <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">Run the same transformations you use in the browser from a script. The <Link className="text-lime underline underline-offset-2" href="/docs/api">endpoint index</Link> has working examples for all {liveTools.length} live tools.</p>
    <div className="mt-6 grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10">
      <aside><nav aria-label="On this page" className="flex flex-wrap gap-x-3 gap-y-2 border-y border-line py-3 text-sm text-muted lg:sticky lg:top-20 lg:flex-col lg:border-y-0 lg:border-l lg:px-3">
        {sections.map(([id, label]) => <a key={id} href={`#${id}`} className="hover:text-lime">{label}</a>)}
      </nav></aside>
      <div className="prose-shell min-w-0">
        <section id="quickstart"><h2 className="!mt-0">Quickstart</h2>
          <p><Link href="/dashboard">Create a key in the dashboard</Link> and set it as the environment variable <code>TOOLZYNC_KEY</code>. Choose an example and run it in your terminal. For local development, replace the API domain with your local server origin.</p>
          <div className="mt-4"><CodeSample /></div>
        </section>
        <section id="auth"><h2>Authentication</h2><p>Send <code>Authorization: Bearer &lt;key&gt;</code> or <code>x-api-key: &lt;key&gt;</code>. Keep the key in your server environment. The browser workbenches do not need it.</p>
          <p>Copy each key at creation. You can hide and reopen the most recently created key on that dashboard page. After leaving or reloading, only its prefix is available. To rotate, create a replacement, update your script, then confirm revocation of the old key. Revoked keys stay listed and stop authenticating immediately.</p>
        </section>
        <section id="envelope"><h2>Request &amp; response</h2><p>POST a JSON object to <code>/v1/&lt;tool-slug&gt;</code>. Fields depend on the tool: the slug generator accepts <code>input</code>, while the UUID generator accepts <code>count</code>. A successful response looks like this:</p>
          <pre tabIndex={0} role="group" aria-label="Example response envelope"><code>{JSON.stringify({ ok: true, data: { slug: "friday-release-notes" }, meta: { tool: "slug-generator", name: "Slug generator", version: "v1", request_id: "req_example", latency_ms: 4 } }, null, 2)}</code></pre>
        </section>
        <section id="limits"><h2>Rate limits</h2><p>The free tier allows two active keys. Each has a burst limit of 60 requests per minute. The 1,000 successful API calls per month are shared across the account and reset on the first of each month at 00:00 UTC.</p>
          <p>Read <code>x-ratelimit-remaining</code>, <code>x-quota-remaining</code> and <code>x-quota-reset</code> on successful responses. Creating or revoking keys does not reset usage. Separate successful retries each use quota.</p>
        </section>
        <section id="errors"><h2>Errors</h2><p>Check the HTTP status first. Tool errors also include <code>error.code</code> and <code>error.message</code>. Use the <code>x-request-id</code> response header to identify a call.</p>
          <div tabIndex={0} role="group" aria-label="API error reference" className="mt-4 overflow-x-auto rounded-lg border border-line"><table className="w-full min-w-[32rem]"><caption className="sr-only">API errors and recovery steps</caption><thead><tr><th>Status</th><th>Code or reason</th><th>Next step</th></tr></thead><tbody>{errors.map(([status, code, hint]) => <tr key={status}><td>{status}</td><td className="font-mono">{code}</td><td>{hint}</td></tr>)}</tbody></table></div>
        </section>
        <section id="versioning"><h2>Versioning</h2><p>The current public API is <code>/v1</code>. Use <Link href="/docs/api">the live endpoint index</Link> for supported tools, and ignore unrecognized response fields when decoding JSON.</p></section>
      </div>
    </div>
  </div>;
}
