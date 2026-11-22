"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "./copy-button";
import styles from "./dashboard.module.css";

export function DashboardQuickstart({ baseUrl }: { baseUrl: string }) {
  const url = `${baseUrl}/v1/slug`;
  const payload = '{"input":"Friday release notes"}';
  const snippets = {
    PowerShell: `Invoke-RestMethod -Method Post -Uri '${url}' \`\n  -Headers @{ 'x-api-key' = $env:TOOLZYNC_KEY } \`\n  -ContentType 'application/json' \`\n  -Body '${payload}'`,
    cURL: `curl '${url}' \\\n  -H "Authorization: Bearer $TOOLZYNC_KEY" \\\n  -H 'Content-Type: application/json' \\\n  -d '${payload}'`,
    'Node.js': `const res = await fetch('${url}', {\n  method: 'POST',\n  headers: { 'x-api-key': process.env.TOOLZYNC_KEY, 'Content-Type': 'application/json' },\n  body: JSON.stringify({ input: 'Friday release notes' }),\n});\nconsole.log(await res.json());`,
  };
  const [language, setLanguage] = useState<keyof typeof snippets>("PowerShell");

  return <section id="quickstart" aria-labelledby="quickstart-title" className="card min-w-0 p-5">
    <p className="eyebrow"><span className="index-tag">03</span> Integration</p>
    <h2 id="quickstart-title" className={`${styles.panelTitle} mt-2`}>Send a request</h2>
    <p className="mt-2 text-sm leading-relaxed text-muted">Set <code>TOOLZYNC_KEY</code> in your terminal environment, then run this example against your deployment. Refresh usage after it succeeds.</p>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <div role="group" aria-label="Snippet language" className={styles.switches}>
        {(Object.keys(snippets) as (keyof typeof snippets)[]).map(key => <button key={key} type="button" aria-pressed={language === key} onClick={() => setLanguage(key)}>{key}</button>)}
      </div>
      <CopyButton value={snippets[language]} label="Copy request" />
    </div>
    <pre tabIndex={0} role="group" aria-label={`${language} request`} className="mt-2 overflow-x-auto rounded-md border border-line bg-ink p-3 font-mono text-xs leading-relaxed"><code>{snippets[language]}</code></pre>
    <Link className="mt-3 inline-block text-sm text-cyan hover:underline" href="/docs/api">Explore endpoints →</Link>
  </section>;
}
