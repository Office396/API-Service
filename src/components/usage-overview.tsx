"use client";

import Link from "next/link";
import { useState } from "react";
import type { AccountUsage, PublicKey } from "@/lib/api-keys";
import { Glyph } from "./glyph";
import styles from "./dashboard.module.css";

type Snapshot = { keys: PublicKey[]; usage: AccountUsage };
const number = new Intl.NumberFormat("en-US");
const shortMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const longMonth = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const requests = (n: number) => `${number.format(n)} ${n === 1 ? "request" : "requests"}`;
const monthDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

function MonthlyChart({ history }: { history: AccountUsage["history"] }) {
  const [month, setMonth] = useState<string | null>(null);
  const selected = history.find(item => item.month === month) ?? history[history.length - 1];
  const peak = Math.max(...history.map(item => item.used));
  return <>
    <p role="status" className="mt-3 text-sm text-muted">
      <strong className="font-medium text-fg">{longMonth.format(monthDate(selected.month))}</strong> · {requests(selected.used)}
    </p>
    <div className={styles.plot} role="group" aria-label="Successful requests by month, UTC">
      {history.map(item => {
        const date = monthDate(item.month);
        const label = `${longMonth.format(date)}: ${requests(item.used)}`;
        return <button key={item.month} type="button" className={styles.column}
          aria-pressed={item.month === selected.month} aria-label={label} title={label} onClick={() => setMonth(item.month)}>
          <span className={styles.barTrack} aria-hidden="true"><span className={styles.bar} style={{ transform: `scaleY(${peak ? item.used / peak : 0})` }} /></span>
          <span>{shortMonth.format(date)}</span>
        </button>;
      })}
    </div>
    <p className="mt-3 text-xs text-faint">{peak ? `Six months · peak ${requests(peak)} in a month. Select a month for its total.` : "No successful API calls in these six months. Browser runs don’t count here."}</p>
  </>;
}

function KeyBreakdown({ keys, used }: { keys: PublicKey[]; used: number }) {
  const rows = keys.filter(key => key.requestsThisMonth > 0).map(key => ({
    id: key.id, name: key.name, used: key.requestsThisMonth, revoked: Boolean(key.revokedAt),
  })).sort((a, b) => b.used - a.used || a.name.localeCompare(b.name));
  // Older databases could delete key rows on revoke. The billed total remains authoritative.
  const remainder = used - rows.reduce((n, key) => n + key.used, 0);
  if (remainder > 0) rows.push({ id: "earlier", name: "Earlier keys", used: remainder, revoked: false });
  if (!rows.length) return <p className="py-8 text-sm text-muted">No calls to break down this month. Run a request with a key, then refresh usage.</p>;
  return <ul className="mt-4 max-h-56 space-y-4 overflow-auto" aria-label="Requests per key">
    {rows.map(row => <li key={row.id}>
      <div className="flex justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{row.name}{row.revoked && <span className="text-faint"> · revoked</span>}</span>
        <span className="shrink-0 font-mono text-xs text-cyan">{requests(row.used)}</span>
      </div>
      <div className={styles.meter} aria-hidden="true"><i style={{ transform: `scaleX(${row.used / Math.max(used, 1)})` }} /></div>
    </li>)}
  </ul>;
}

function Volume({ keys, usage }: Snapshot) {
  const [view, setView] = useState<"month" | "key">("month");
  return <section id="request-volume" aria-labelledby="volume-title" className="card min-w-0 p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="volume-title" className={styles.panelTitle}>Request volume</h2>
      <div className={styles.switches} role="group" aria-label="Group usage">
        <button type="button" aria-pressed={view === "month"} onClick={() => setView("month")}>By month</button>
        <button type="button" aria-pressed={view === "key"} onClick={() => setView("key")}>By key</button>
      </div>
    </div>
    {view === "month" ? <MonthlyChart history={usage.history} /> : <>
      <p className="mt-3 text-sm text-muted">{longMonth.format(new Date(usage.asOf))} · {requests(usage.used)} across your keys</p>
      <KeyBreakdown keys={keys} used={usage.used} />
    </>}
  </section>;
}

function Activity({ keys }: { keys: PublicKey[] }) {
  const events = keys.flatMap(key => [
    { id: key.id, name: key.name, action: "Created", at: key.createdAt },
    { id: key.id, name: key.name, action: "Last used", at: key.lastUsedAt },
    { id: key.id, name: key.name, action: "Revoked", at: key.revokedAt },
  ]).filter((event): event is typeof event & { at: string } => event.at !== null)
    .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);

  return <section aria-labelledby="activity-title" className="card min-w-0 p-5">
    <h2 id="activity-title" className={styles.panelTitle}>Recent key activity</h2>
    {events.length ? <ol className="mt-3 divide-y divide-line">
      {events.map(event => <li key={`${event.id}-${event.action}`} className="flex items-center gap-2.5 py-2.5">
        <Glyph name={event.action === "Last used" ? "pulse" : "key"} className={event.action === "Revoked" ? "text-amber" : "text-cyan"} />
        <div className="min-w-0"><p className="truncate text-sm"><span className="text-muted">{event.action} · </span>{event.name}</p>
          <time dateTime={event.at} className="font-mono text-[10.5px] text-faint">{event.at.slice(0, 10)} · {event.at.slice(11, 16)} UTC</time></div>
      </li>)}
    </ol> : <p className="mt-4 text-sm leading-relaxed text-muted">Your key’s creation, latest successful call, and revocation will appear here. Start by creating a key for your project.</p>}
  </section>;
}

export function UsageOverview({ keys, usage }: Snapshot) {
  const active = keys.filter(key => !key.revokedAt);
  const lastUsed = keys.reduce<string | null>((last, key) => key.lastUsedAt && (!last || key.lastUsedAt > last) ? key.lastUsedAt : last, null);
  const remaining = Math.max(0, usage.limit - usage.used);
  const setup = !active.length || !lastUsed;

  return <div className="space-y-4">
    <div className={styles.metrics}>
      <article aria-label="Monthly requests" className={`${styles.metric} ${styles.allowance}`}>
        <p className="label">Requests this month</p>
        <p className={styles.metricValue}>{number.format(usage.used)} <small>/ {number.format(usage.limit)}</small></p>
        <div className={styles.meter} role="meter" aria-label="Monthly quota used" aria-valuenow={usage.used} aria-valuemin={0} aria-valuemax={usage.limit}>
          <i style={{ transform: `scaleX(${Math.min(1, usage.used / usage.limit)})` }} />
        </div>
        <p className={styles.detail}>{number.format(remaining)} remaining · resets {shortDate.format(new Date(usage.resetsAt))} UTC</p>
      </article>
      <article className={styles.metric} aria-label="Active keys">
        <p className="label flex items-center gap-2"><Glyph name="key" size={14} /> Active keys</p>
        <p className={styles.metricValue}>{active.length} <small>/ {usage.keyLimit}</small></p>
        <a href="#api-keys" className="arrow-link mt-auto pt-3 text-xs text-lime">Manage keys <Glyph name="arrow" size={13} /></a>
      </article>
      <article className={styles.metric} aria-label="Last API call">
        <p className="label flex items-center gap-2"><Glyph name="pulse" size={14} /> Last API call</p>
        <p className={styles.dateValue}>{lastUsed ? shortDate.format(new Date(lastUsed)) : "None yet"}</p>
        <p className={styles.detail}>{lastUsed ? `${lastUsed.slice(0, 4)} · ${lastUsed.slice(11, 19)} UTC` : "Waiting for a successful request"}</p>
      </article>
    </div>
    {(setup || remaining === 0) && <div className={styles.nextStep}>
      <div><p className="label text-lime">{remaining === 0 ? "Quota reached" : "Next step"}</p>
        <p className="mt-1 text-sm">{remaining === 0 ? "Your allowance renews at the next monthly reset." : !active.length ? "Create an active key to connect your project." : "Your key is ready. Send a request to start tracking usage."}</p></div>
      {remaining === 0 ? <Link className="btn btn-ghost" href="/pricing">View plans</Link> : <a className="btn btn-ghost" href={active.length ? "#quickstart" : "#api-keys"}>{active.length ? "Open quickstart" : "Set up a key"} <Glyph name="arrow" size={14} /></a>}
    </div>}
    <div className={styles.panels}><Volume keys={keys} usage={usage} /><Activity keys={keys} /></div>
  </div>;
}
