"use client";

import { ToolResultCard } from "./tool-result-card";

interface ToolErrorCardProps {
  /** Message produced by the tool itself, or by the sanitizer for an interrupted call. */
  errorText: string;
}

/**
 * Renders a tool call that ended in an error. This also covers the calls that were interrupted
 * mid-flight (e.g. the page was reloaded before an approval was answered): the history is
 * repaired on load so they always reach this terminal state instead of leaving a dead end.
 */
export function ToolErrorCard({ errorText }: ToolErrorCardProps) {
  return (
    <ToolResultCard tone="error">
      <p className="text-sm">{errorText}</p>
    </ToolResultCard>
  );
}
