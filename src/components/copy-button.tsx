"use client";

import { useEffect, useRef, useState } from "react";
import { Glyph } from "./glyph";

export function CopyButton({
  value,
  label = "copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timeout.current), []);
  const name = /^copy\b/i.test(label) ? label : `Copy ${label}`;

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setStatus("copied");
        } catch {
          setStatus("failed");
        }
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => setStatus("idle"), 2000);
      }}
      disabled={!value}
      aria-label={status === "idle" ? name : undefined}
      className={`result-action disabled:opacity-50 ${status === "copied" ? "text-lime" : ""} ${className}`}
    >
      <Glyph name={status === "copied" ? "check" : "copy"} size={13} />
      <span aria-live="polite">{status === "copied" ? "Copied" : status === "failed" ? "Select & copy manually" : label}</span>
    </button>
  );
}
