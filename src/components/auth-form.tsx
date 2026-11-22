"use client";

import { useRef, useState, type FormEvent } from "react";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, signUpPasswordError } from "@/lib/password-policy";
import { switchSession } from "./account-navigation";

export function AuthForm() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const passwordInput = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    if (register) {
      const message = signUpPasswordError(passwordInput.current?.value ?? "");
      if (message) {
        setError(message);
        passwordInput.current?.focus();
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${register ? "sign-up" : "sign-in"}/email`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fields)),
      });
      if (res.ok) { switchSession("/dashboard"); return; }
      const body = await res.json();
      setError(body.error?.message ?? "Could not sign in. Please try again.");
    } catch { setError("Could not reach the account service. Please try again."); }
    setBusy(false);
  }

  return (
    <section className="card w-full max-w-md p-6 sm:p-8">
      <p className="label">Toolzync console</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{register ? "Create an account" : "Sign in"}</h1>
      <p className="mt-2 text-sm text-muted">{register ? "Start with two API keys and 1,000 requests a month. No card required." : "Manage your API keys and check your monthly usage."}</p>
      <form onSubmit={submit} onChange={() => { if (error) setError(""); }} method="post" className="mt-6 space-y-4">
        {register && <label className="block text-sm">Name<input name="name" className="field mt-1" autoComplete="name" required maxLength={80} /></label>}
        <label className="block text-sm">Email<input name="email" type="email" className="field mt-1" autoComplete="email" required maxLength={254} /></label>
        <label className="block text-sm">Password<input key={register ? "new" : "current"} ref={passwordInput} name="password" type="password" className="field mt-1"
          autoComplete={register ? "new-password" : "current-password"} required minLength={register ? MIN_PASSWORD_LENGTH : 1} maxLength={MAX_PASSWORD_LENGTH} aria-describedby={register ? "password-hint" : undefined} /></label>
        {register && <p id="password-hint" className="text-xs text-muted">Use at least {MIN_PASSWORD_LENGTH} characters.</p>}
        {error && <p role="alert" className="text-sm text-amber">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
      </form>
      <button type="button" disabled={busy} onClick={() => { setRegister(!register); setError(""); }} className="mt-4 text-sm text-cyan hover:underline">
        {register ? "Already have an account? Sign in" : "Create a free account"}
      </button>
    </section>
  );
}
