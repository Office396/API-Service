"use client";

import { useState } from "react";

type State = { status: "idle" | "sending" | "sent" | "error"; message?: string };

const fields = [
  { name: "name", label: "Your name", type: "text", placeholder: "Ada Lovelace", required: true },
  { name: "email", label: "Work email", type: "email", placeholder: "ada@company.com", required: true },
  { name: "company", label: "Company", type: "text", placeholder: "Acme Inc.", required: false },
] as const;

export function ContactForm({ topic = "" }: { topic?: string }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setState({ status: "sending" });

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          company: String(form.get("company") ?? ""),
          volume: String(form.get("volume") ?? ""),
          topic,
          message: String(form.get("message") ?? ""),
        }),
      });
      const body = (await res.json()) as { ok?: boolean; data?: { id: string }; error?: { message?: string } };
      if (!res.ok || !body.ok) {
        setState({
          status: "error",
          message: body.error?.message ?? "Could not send. Email sales@toolzync.com instead.",
        });
        return;
      }
      setState({ status: "sent", message: body.data?.id });
      formEl.reset();
    } catch {
      setState({ status: "error", message: "Network error. Email sales@toolzync.com instead." });
    }
  }

  if (state.status === "sent") {
    return (
      <div className="card flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-lime/30 bg-lime/10 font-mono text-lime">
          ✓
        </span>
        <h2 role="status" className="text-[17px] font-medium">Request received</h2>
        <p className="max-w-sm text-[13px] leading-relaxed text-muted">
          Keep this reference if you follow up: <code>{state.message}</code>.
        </p>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="btn btn-ghost mt-1"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6">
      {topic && <p className="mb-4 text-sm text-muted">Enquiring about: <strong className="text-fg">{topic}</strong></p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label
            key={field.name}
            className={field.name === "company" ? "sm:col-span-2" : ""}
          >
            <span className="label">{field.label}</span>
            <input
              name={field.name}
              type={field.type}
              required={field.required}
              minLength={field.name === "name" ? 2 : undefined}
              maxLength={field.name === "email" ? 254 : field.name === "company" ? 160 : 120}
              placeholder={field.placeholder}
              className="field mt-1.5 w-full"
            />
          </label>
        ))}
        <label className="sm:col-span-2">
          <span className="label">Monthly request volume</span>
          <select name="volume" className="field mt-1.5 w-full" defaultValue="under-50k">
            <option value="under-50k">Under 50k</option>
            <option value="50k-500k">50k – 500k</option>
            <option value="500k-5m">500k – 5M</option>
            <option value="5m-plus">5M+</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="label">What are you building?</span>
          <textarea
            name="message"
            rows={5}
            required
            minLength={12}
            maxLength={4000}
            placeholder="Tools needed, compliance requirements, timeline…"
            className="field mt-1.5 w-full resize-y"
          />
        </label>
      </div>

      {state.status === "error" && (
        <p role="alert" className="mt-4 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-[12px] text-amber">
          {state.message}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] text-faint">
          No newsletter. No sequence. One reply.
        </p>
        <button
          type="submit"
          disabled={state.status === "sending"}
          className="btn btn-primary disabled:opacity-60"
        >
          {state.status === "sending" ? "Sending…" : "Send request"}
        </button>
      </div>
    </form>
  );
}
