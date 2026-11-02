import { createId } from "@paralleldrive/cuid2";
import {
  sanitizeInterruptedMessages,
  sanitizeInterruptedToolParts,
} from "~/lib/chat-message-parts";
import type { MyAgentUIMessage } from "~/lib/agent";
import { db } from "~/server/db";

export class ChatAccessError extends Error {
  constructor() {
    super("Chat not found");
    this.name = "ChatAccessError";
  }
}

export interface ChatRecord {
  id: string;
  userId: string;
  summary: string | null;
  summaryUpToMessageId: string | null;
  summaryTokens: number | null;
}

/**
 * Returns the chat if it belongs to the user, creates it on first use, and refuses a chat id that
 * already belongs to someone else. The previous implementation used an upsert keyed only by id,
 * so knowing another user's chat id was enough to write messages into their conversation.
 */
export async function ensureChat(
  id: string,
  userId: string,
): Promise<ChatRecord> {
  const existing = await db.chat.findUnique({ where: { id } });

  if (existing) {
    if (existing.userId !== userId) throw new ChatAccessError();
    return existing;
  }

  try {
    return await db.chat.create({ data: { id, userId } });
  } catch {
    // Two requests for the same new chat can race. The loser re-reads; if the row belongs to
    // somebody else, it is not a race, it is an attempt to use another user's chat.
    const created = await db.chat.findUnique({ where: { id } });
    if (!created || created.userId !== userId) throw new ChatAccessError();
    return created;
  }
}

/** The full conversation, oldest first, as the UI message shape the agent expects. */
export async function loadChatMessages(
  chatId: string,
): Promise<MyAgentUIMessage[]> {
  const rows = await db.message.findMany({
    where: { chatId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const messages: MyAgentUIMessage[] = [];

  for (const row of rows) {
    try {
      const parts = JSON.parse(row.content) as MyAgentUIMessage["parts"];
      if (!Array.isArray(parts)) continue;

      messages.push({
        id: row.id,
        role: row.role === "USER" ? "user" : "assistant",
        parts: sanitizeInterruptedToolParts(parts) as MyAgentUIMessage["parts"],
      });
    } catch (error) {
      // A corrupt row must not take the whole conversation down. Skipping it is better than
      // failing every future message in the chat.
      console.error("Skipping corrupt chat message", row.id, error);
    }
  }

  return messages;
}

/** Persists one new user turn before the model runs, so a failed stream does not lose it. */
export async function saveUserMessage(
  chatId: string,
  parts: MyAgentUIMessage["parts"],
): Promise<MyAgentUIMessage> {
  const message: MyAgentUIMessage = {
    id: createId(),
    role: "user",
    parts,
  };

  await db.message.create({
    data: {
      id: message.id,
      role: "USER",
      content: JSON.stringify(message.parts),
      chatId,
    },
  });

  return message;
}

/**
 * Upserts every message the stream reports. The ids are generated on the server (the client's
 * ids are never trusted), and the array only contains the canonical history plus the new turn,
 * so this cannot overwrite another conversation.
 */
export async function saveChatMessages(
  chatId: string,
  messages: MyAgentUIMessage[],
): Promise<void> {
  const base = Date.now();
  let index = 0;

  for (const message of sanitizeInterruptedMessages(messages)) {
    const content = JSON.stringify(message.parts);
    // `createdAt` has millisecond precision. A multi-step turn can save several assistant
    // messages in the same millisecond, so give each new row a distinct timestamp; otherwise
    // reloading the chat could reorder the turn.
    const createdAt = new Date(base + index);
    index += 1;

    await db.message.upsert({
      where: { id: message.id, chatId },
      create: {
        id: message.id,
        role: message.role === "user" ? "USER" : "ASSISTANT",
        content,
        chatId,
        createdAt,
      },
      update: { content },
    });
  }
}

/** A canned assistant reply, stored so the refusal survives a reload. */
export async function saveAssistantText(
  chatId: string,
  text: string,
): Promise<void> {
  await db.message.create({
    data: {
      id: createId(),
      role: "ASSISTANT",
      content: JSON.stringify([{ type: "text", text }]),
      chatId,
      // The user message that triggered this refusal was saved a moment earlier; keeping the
      // timestamp strictly after it preserves the order even if the two writes share a millisecond.
      createdAt: new Date(Date.now() + 1),
    },
  });
}
