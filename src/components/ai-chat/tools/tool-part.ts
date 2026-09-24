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
