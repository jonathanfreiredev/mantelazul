import type { MyAgentUIMessage, MyAgentUITools } from "~/lib/agent";

export type ToolName = keyof MyAgentUITools;

export type ToolPart<TName extends ToolName> =
  MyAgentUIMessage["parts"][number] & {
    type: `tool-${TName}`;
  };

export type ToolState = ToolPart<ToolName>["state"];

/** A tool part that ended in an error, whether the tool failed or its call was interrupted. */
export type ToolErrorPart = Extract<
  MyAgentUIMessage["parts"][number],
  { state: "output-error" }
>;

/**
 * True when a message part belongs to one of the given tools. Narrows the part type so the
 * renderer can read `part.input` / `part.output` safely.
 */
export function isToolPart<TName extends ToolName>(
  part: MyAgentUIMessage["parts"][number],
  toolNames: readonly TName[],
): part is ToolPart<TName> {
  return toolNames.some((name) => part.type === `tool-${name}`);
}

/** True for any tool part that ended in an error (failed tool or interrupted call). */
export function isToolErrorPart(
  part: MyAgentUIMessage["parts"][number],
): part is ToolErrorPart {
  return (
    part.type.startsWith("tool-") &&
    "state" in part &&
    part.state === "output-error"
  );
}

/**
 * Name of the tool a part calls, or null when the part is not a tool call. The cast is safe in
 * practice because the parts come from this agent's own tools; a name that is not one of them is
 * handled by the caller's fallback.
 */
export function toolNameOf(
  part: MyAgentUIMessage["parts"][number],
): ToolName | null {
  if (!part.type.startsWith("tool-")) return null;

  return part.type.slice("tool-".length) as ToolName;
}

/**
 * True while a tool is still running: its arguments are ready (or still being written) and there
 * is no result yet. This is what the chat turns into "Searching for recipes", "Saving the
 * recipe" and so on.
 */
export function isRunningToolPart(
  part: MyAgentUIMessage["parts"][number],
): boolean {
  return (
    part.type.startsWith("tool-") &&
    "state" in part &&
    (part.state === "input-streaming" || part.state === "input-available")
  );
}
