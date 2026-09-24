"use client";

import { motion } from "motion/react";
import { Loader2Icon, SparklesIcon } from "lucide-react";

export type AssistantActivity =
  { kind: "thinking" } | { kind: "typing" } | { kind: "working" };

/**
 * Small status chip shown while the assistant is busy. It replaces the plain label with
 * something that reflects what is actually happening: waiting on the model, streaming text,
 * or running a tool.
 */
export function AssistantActivityIndicator({
  activity,
}: {
  activity: AssistantActivity;
}) {
  const label =
    activity.kind === "thinking"
      ? "Thinking"
      : activity.kind === "typing"
        ? "Typing"
        : "Working";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2 flex"
    >
      <div className="flex items-center gap-2 rounded-full bg-neutral-300/60 px-3 py-1.5 dark:bg-neutral-700/60">
        {activity.kind === "typing" ? (
          <span className="flex gap-1">
            <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500" />
          </span>
        ) : activity.kind === "working" ? (
          <Loader2Icon className="size-3 animate-spin text-neutral-500" />
        ) : (
          <SparklesIcon className="size-3 animate-pulse text-neutral-500" />
        )}
        <span className="text-xs font-medium text-neutral-500">{label}</span>
      </div>
    </motion.div>
  );
}
