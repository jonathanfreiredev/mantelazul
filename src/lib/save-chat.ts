import { type UIMessage } from "ai";
import { sanitizeInterruptedMessages } from "~/lib/chat-message-parts";
import { db } from "~/server/db";

export async function saveChat(
  messages: UIMessage[],
  id: string,
  userId: string,
) {
  const chat = await db.chat.upsert({
    where: { id },
    update: {},
    create: { id, userId },
  });

  if (!chat) throw new Error("Chat not found");

  // A stream that was aborted mid-tool-call leaves non-terminal tool parts behind; persist them
  // as terminal errors so reloading the chat cannot jam it.
  const lastTwoMessages = sanitizeInterruptedMessages(messages).slice(-2);

  for (const msg of lastTwoMessages) {
    const content = JSON.stringify(msg.parts);

    await db.message.upsert({
      where: { id: msg.id, chatId: chat.id },
      create: {
        id: msg.id,
        role: msg.role === "user" ? "USER" : "ASSISTANT",
        content: content,
        chatId: chat.id,
      },
      update: {
        content: content,
      },
    });
  }
}
