import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard-client";
import { authOrigin, sessionUser } from "@/lib/auth";
import { accountKeys } from "@/lib/api-keys";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
  description: "Your Toolzync workspace: track API usage, review key activity and manage your integrations.",
};

async function AccountDashboard() {
  const user = await sessionUser(await headers());
  if (!user) redirect("/sign-in");
  const { keys, usage } = accountKeys(user.id);
  return <DashboardClient key={user.id} email={user.email} initialKeys={keys} initialUsage={usage} baseUrl={authOrigin()} />;
}

export default function DashboardPage() {
  return <Suspense fallback={<p role="status" className="shell py-12 text-sm text-muted">Opening your console…</p>}><AccountDashboard /></Suspense>;
}
