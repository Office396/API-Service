import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolBrowser } from "@/components/tool-browser";
import { liveTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Tool library", description: "Find a live developer tool, bookmark your favorites, or explore the Toolzync roadmap.",
};

export default function ToolsPage() {
  return <div className="shell py-9 sm:py-12">
    <div className="reveal"><p className="eyebrow"><span className="index-tag">TZ</span> Directory</p>
      <h1 className="section-title mt-3">Tool library</h1>
      <p className="mt-3 max-w-xl text-base text-muted">{liveTools.length} tools ready to use. Find one by name or task, and bookmark the ones you come back to.</p>
    </div>
    <Suspense fallback={<p role="status" className="mt-8 text-sm text-muted">Opening the tool library…</p>}><ToolBrowser /></Suspense>
  </div>;
}
