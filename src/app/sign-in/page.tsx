import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { sessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

async function SignIn() {
  if (await sessionUser(await headers())) redirect("/dashboard");
  return <AuthForm />;
}

export default function SignInPage() {
  return (
    <div className="shell flex justify-center py-16">
      <Suspense fallback={<p role="status" className="text-sm text-muted">Opening your console…</p>}><SignIn /></Suspense>
    </div>
  );
}
