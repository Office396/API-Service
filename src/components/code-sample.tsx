"use client";

import { useState } from "react";
import { CopyButton } from "./copy-button";

const samples = {
  curl: {
    label: "cURL",
    tool: "hash-generator",
    name: "Hash generator",
    data: { hash: "73417e56523b0d04753901e023d4496fe93cdd854373f580a05bf1d0c4df8e60", algorithm: "sha256" },
    code: `curl https://api.toolzync.com/v1/hash \\
  -H "Authorization: Bearer $TOOLZYNC_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "hello toolzync",
    "algorithm": "sha256"
  }'`,
  },
  node: {
    label: "Node",
    tool: "slug-generator",
    name: "Slug generator",
    data: { slug: "ship-10x-faster" },
    code: `const res = await fetch("https://api.toolzync.com/v1/slug", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.TOOLZYNC_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ input: "Ship 10x faster" }),
});

const { data } = await res.json();
console.log(data.slug); // "ship-10x-faster"`,
  },
  python: {
    label: "Python",
    tool: "uuid-generator",
    name: "UUID generator",
    data: {
      uuids: ["a8ca4c6e-c233-4687-ab51-22bc84729034", "9a1f1a8d-898b-468f-9eaf-3eb54599b35d", "3a30bb23-4298-4826-8a3c-93eae5d29132"],
      count: 3,
    },
    code: `import os, requests

res = requests.post(
    "https://api.toolzync.com/v1/uuid",
    headers={"Authorization": f"Bearer {os.environ['TOOLZYNC_KEY']}"},
    json={"count": 3},
    timeout=10,
)
print(res.json()["data"]["uuids"])`,
  },
} as const;

type Tab = keyof typeof samples;

export function CodeSample({ defaultTab = "curl" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const active = samples[tab];
  const response = {
    ok: true,
    data: active.data,
    meta: { tool: active.tool, name: active.name, version: "v1", request_id: "req_8f2cb6c1d0", latency_ms: 41 },
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-1">
          {Object.entries(samples).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as Tab)}
              aria-pressed={tab === key}
              className={`rounded-md px-2 py-1 font-mono text-[10.5px] transition ${
                tab === key ? "bg-white/10 text-fg" : "text-faint hover:text-fg"
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
        <CopyButton value={active.code} />
      </div>
      <pre tabIndex={0} role="group" aria-label={`${active.label} example request`} className="overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed text-fg/85">
        <code>{active.code}</code>
      </pre>
      <div className="border-t border-line bg-black/25 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-faint">
          <span>
            Sample response <span className="text-lime">·</span> 200 OK
          </span>
          <span>x-quota-remaining: 998</span>
          <span>x-request-id: {response.meta.request_id}</span>
        </div>
        <pre tabIndex={0} role="group" aria-label="Example JSON response" className="mt-2 max-h-52 overflow-auto font-mono text-[11px] leading-relaxed text-muted">
          <code>{JSON.stringify(response, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}
