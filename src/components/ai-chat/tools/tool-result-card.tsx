"use client";

import type { ReactNode } from "react";

interface ToolResultCardProps {
  children: ReactNode;
  /** "success" is the neutral card, "denied" highlights a rejected approval. */
  tone?: "success" | "denied";
}

const toneClasses = {
  success: "border-slate-300 bg-slate-100",
  denied: "border-red-300 bg-red-100",
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
