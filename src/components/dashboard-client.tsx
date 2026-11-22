"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AccountUsage, PublicKey } from "@/lib/api-keys";
import { sessionChannel, switchSession } from "./account-navigation";
import { CopyButton } from "./copy-button";
import { DashboardQuickstart } from "./dashboard-quickstart";
import { Glyph } from "./glyph";
import { UsageOverview } from "./usage-overview";
import styles from "./dashboard.module.css";

type Props = { email: string; initialKeys: PublicKey[]; initialUsage: AccountUsage; baseUrl: string };
type Action = "refresh" | "create" | "revoke" | "sign-out";
type Issue = { area: "overview" | "keys"; message: string };

async function failureMessage(res: Response, fallback: string) {
  try {
    const body = await res.json() as { error?: { message?: string } };
    return body.error?.message ?? fallback;
  } catch { return fallback; }
}

export function DashboardClient({ email, initialKeys, initialUsage, baseUrl }: Props) {
  const [keys, setKeys] = useState(initialKeys);
  const [usage, setUsage] = useState(initialUsage);
  const [revealed, setRevealed] = useState<{ id: string; value: string } | null>(null);
  const [visible, setVisible] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const busy = action !== null;
  const activeCount = keys.filter(key => !key.revokedAt).length;

  useEffect(() => {
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(sessionChannel) : null;
    if (channel) channel.onmessage = () => window.location.reload();
    const onShow = (event: PageTransitionEvent) => { if (event.persisted) window.location.reload(); };
    window.addEventListener("pageshow", onShow);
    return () => { channel?.close(); window.removeEventListener("pageshow", onShow); };
  }, []);

  function begin(next: Action) { setAction(next); setIssue(null); }

  async function refresh() {
    begin("refresh");
    const fallback = "Could not refresh usage. Please try again.";
    try {
      const res = await fetch("/api/keys", { cache: "no-store" });
      if (res.status === 401) { switchSession("/sign-in"); return; }
      if (!res.ok) { setIssue({ area: "overview", message: await failureMessage(res, fallback) }); return; }
      const body = await res.json() as { data: PublicKey[]; meta: { usage: AccountUsage } };
      setKeys(body.data);
      setUsage(body.meta.usage);
      const live = new Set(body.data.filter(key => !key.revokedAt).map(key => key.id));
      setRevealed(prev => prev && live.has(prev.id) ? prev : null);
      setConfirming(prev => prev && live.has(prev) ? prev : null);
    } catch { setIssue({ area: "overview", message: fallback }); }
    finally { setAction(null); }
  }

  async function signOut() {
    begin("sign-out");
    setRevealed(null);
    const fallback = "Could not sign out. Please try again.";
    try {
      const res = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) { setIssue({ area: "overview", message: await failureMessage(res, fallback) }); return; }
      switchSession("/sign-in");
    } catch { setIssue({ area: "overview", message: fallback }); }
    finally { setAction(null); }
  }

  async function createKey() {
    begin("create");
    try {
      const res = await fetch("/api/keys", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() || "Untitled key" }),
      });
      if (res.status === 401) { switchSession("/sign-in"); return; }
      if (!res.ok) { setIssue({ area: "keys", message: await failureMessage(res, "Could not create a key.") }); return; }
      const { data } = await res.json() as { data: { key: string; record: PublicKey } };
      setRevealed({ id: data.record.id, value: data.key });
      setVisible(true);
      setKeys(prev => [data.record, ...prev]);
      setName("");
    } catch { setIssue({ area: "keys", message: "Could not create a key. Refresh the list before trying again." }); }
    finally { setAction(null); }
  }

  async function revoke(id: string) {
    begin("revoke");
    const fallback = "Could not revoke this key. Please try again.";
    try {
      const res = await fetch(`/api/keys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.status === 401) { switchSession("/sign-in"); return; }
      if (res.status === 404) { setConfirming(null); await refresh(); return; }
      if (!res.ok) { setIssue({ area: "keys", message: await failureMessage(res, fallback) }); return; }
      const { data } = await res.json() as { data: { revokedAt: string } };
      setKeys(prev => prev.map(key => key.id === id ? { ...key, revokedAt: data.revokedAt } : key)
        .sort((a, b) => Number(Boolean(a.revokedAt)) - Number(Boolean(b.revokedAt))));
      setRevealed(prev => prev?.id === id ? null : prev);
      setConfirming(null);
    } catch { setIssue({ area: "keys", message: fallback }); }
    finally { setAction(null); }
  }

  return <div className={`shell ${styles.frame}`}>
    <aside className={styles.rail}>
      <p className="label">API console</p><p className={styles.railTitle}>Personal workspace</p>
      <nav aria-label="Workspace sections">
        <a href="#overview"><Glyph name="grid" /> Overview</a>
        <a href="#api-keys"><Glyph name="key" /> API keys</a>
        <a href="#quickstart"><Glyph name="terminal" /> Quickstart</a>
        <Link href="/pricing"><Glyph name="layers" /> View plans</Link>
      </nav>
    </aside>
    <div className="min-w-0 space-y-5">
      <div id="overview" className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><p className="eyebrow"><span className="index-tag">01</span> Dashboard · Free plan</p>
          <h1 className="section-title mt-2">Workspace overview</h1>
          <p className="mt-2 text-sm break-all text-muted">{email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={refresh}><Glyph name="reset" size={14} />{action === "refresh" ? "Refreshing…" : "Refresh usage"}</button>
          <button type="button" className="result-action" disabled={busy} onClick={signOut}>Sign out</button>
        </div>
      </div>
      {issue?.area === "overview" && <p role="alert" className="text-sm text-amber">{issue.message}</p>}
      <UsageOverview keys={keys} usage={usage} />

      <section id="api-keys" aria-labelledby="keys-title" className="card min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line p-5">
          <div><p className="eyebrow"><span className="index-tag">02</span> Access</p>
            <h2 id="keys-title" className={`${styles.panelTitle} mt-2`}>API keys</h2>
            <p className="mt-1 text-xs text-muted">{activeCount} of {usage.keyLimit} active. Revocation takes effect immediately.</p>
          </div>
          <form className="flex w-full max-w-sm gap-2" onSubmit={e => { e.preventDefault(); if (!busy && activeCount < usage.keyLimit) void createKey(); }}>
            <input value={name} onChange={e => setName(e.target.value)} aria-label="New key name" placeholder="Key name, e.g. staging" maxLength={60} className="field min-w-0 flex-1 text-sm" />
            <button type="submit" disabled={busy || activeCount >= usage.keyLimit} className="btn btn-primary disabled:opacity-55">{action === "create" ? "Creating…" : "Create key"}</button>
          </form>
        </div>
        {issue?.area === "keys" && <p role="alert" className="border-b border-line px-5 py-3 text-sm text-amber">{issue.message}</p>}
        {revealed && visible && <div className="border-b border-lime/30 bg-lime/5 p-5">
          <div className="flex items-center justify-between gap-3"><p className="label text-lime">Copy your new key</p><CopyButton label="Copy key" value={revealed.value} /></div>
          <pre tabIndex={0} role="group" aria-label="New API key" className="my-2 overflow-x-auto rounded-lg bg-ink p-3 font-mono text-xs text-lime"><code>{revealed.value}</code></pre>
          <p className="text-xs leading-relaxed text-muted">Copy this before leaving, reloading, or creating another key. Only the hash and prefix are saved.</p>
          <button type="button" className="result-action mt-3" onClick={() => setVisible(false)}>I have stored it — hide</button>
        </div>}
        {keys.length === 0 ? <p className="px-5 py-6 text-sm text-muted">No keys yet. Name your first key after the project that will use it.</p> :
          <ul className="divide-y divide-line">{keys.map(key => <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-auto">
              <p className="truncate text-sm font-medium">{key.name}</p>
              <p className="mt-1 font-mono text-[10.5px] text-faint">{key.prefix}… · created {key.createdAt.slice(0, 10)} · {key.lastUsedAt ? `last used ${key.lastUsedAt.slice(0, 10)}` : "never used"}</p>
            </div>
            <span className="font-mono text-xs text-muted">{key.requestsThisMonth} req</span>
            {key.revokedAt ? <span className="rounded border border-amber/30 px-2 py-1 font-mono text-[11px] text-amber">revoked {key.revokedAt.slice(0, 10)}</span> :
              <div className="flex flex-wrap items-center gap-1.5">
                {revealed?.id === key.id && <button type="button" className="result-action" onClick={() => setVisible(v => !v)}>{visible ? "Hide API key" : "Show API key"}</button>}
                {confirming === key.id ? <>
                  <button type="button" disabled={busy} className="result-action !text-amber" onClick={() => revoke(key.id)} aria-label={`Confirm revoke ${key.name}`}>Confirm revoke</button>
                  <button type="button" disabled={busy} className="result-action" onClick={() => setConfirming(null)}>Cancel</button>
                </> : <button type="button" className="result-action hover:!text-amber" disabled={busy} aria-label={`Revoke ${key.name}`} onClick={() => setConfirming(key.id)}>Revoke</button>}
              </div>}
          </li>)}</ul>}
      </section>
      <DashboardQuickstart baseUrl={baseUrl} />
    </div>
  </div>;
}
