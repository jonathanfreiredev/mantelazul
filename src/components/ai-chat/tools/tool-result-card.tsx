"use client";

import type { ReactNode } from "react";

interface ToolResultCardProps {
  children: ReactNode;
  /** "success" is the neutral card, "denied" a rejected approval, "error" a failed tool call. */
  tone?: "success" | "denied" | "error";
}

const toneClasses = {
  success:
    "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800",
  denied: "border-red-300 bg-red-100 dark:border-red-800 dark:bg-red-950",
  error:
    "border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-950",
} as const;

/** Card that wraps the outcome of a tool call inside the chat. */
export function ToolResultCard({
  children,
  tone = "success",
}: ToolResultCardProps) {
  return (
    <div
      className={`mb-5 flex flex-col gap-4 rounded-lg border p-4 ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
}
