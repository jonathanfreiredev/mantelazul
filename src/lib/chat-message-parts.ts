/**
 * Chat message parts can be left in a non-terminal state when the stream that produced them is
 * cut off before it finishes, which happens whenever the user reloads the page (or the
 * connection drops) while the agent is calling a tool.
 *
 * A tool part is only usable once it reaches a terminal state: the tool ran
 * (`output-available` / `output-error` / `output-denied`) or it is waiting for the user
 * (`approval-requested`). A part still in `input-streaming` or `input-available` may even hold
 * a truncated input, and it cannot be rendered nor resumed:
 *
 * - `input-streaming` is silently dropped when the message history is sent back to the model,
 *   so the user gets no answer and no explanation.
 * - `input-available` fails server-side validation because its partial input no longer matches
 *   the tool schema, which jams the whole conversation.
 *
 * Rewriting them as a terminal error keeps the history valid and gives the UI something clear
 * to show. `approval-requested` is deliberately left untouched: it is a valid, resumable state,
 * so a reloaded page can still show the approval prompt and let the user answer it.
 */
export const INTERRUPTED_TOOL_ERROR =
  "This action was interrupted before it could run. Please ask again.";

const NON_TERMINAL_TOOL_STATES = new Set([
  "input-streaming",
  "input-available",
]);

interface ChatPartLike {
  type: string;
  state?: string;
}

function isToolPart(
  part: ChatPartLike,
): part is ChatPartLike & { state: string } {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

/**
 * Returns the parts with any interrupted tool call turned into a terminal error. The partial
 * input is kept: the SDK downgrades a tool part whose input no longer matches the schema to a
 * dynamic tool part instead of rejecting the message.
 */
export function sanitizeInterruptedToolParts<T extends ChatPartLike>(
  parts: T[],
): T[] {
  return parts.map((part) => {
    if (!isToolPart(part) || !NON_TERMINAL_TOOL_STATES.has(part.state)) {
      return part;
    }

    return {
      ...part,
      state: "output-error",
      errorText: INTERRUPTED_TOOL_ERROR,
    } as T;
  });
}

/** Applies {@link sanitizeInterruptedToolParts} to every message. */
export function sanitizeInterruptedMessages<
  T extends { parts: ChatPartLike[] },
>(messages: T[]): T[] {
  return messages.map((message) => ({
    ...message,
    parts: sanitizeInterruptedToolParts(message.parts),
  }));
}
