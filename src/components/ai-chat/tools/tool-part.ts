import type { MyAgentUIMessage, MyAgentUITools } from "~/lib/agent";

export type ToolName = keyof MyAgentUITools;

export type ToolPart<TName extends ToolName> =
  MyAgentUIMessage["parts"][number] & {
    type: `tool-${TName}`;
  };

export type ToolState = ToolPart<ToolName>["state"];

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
