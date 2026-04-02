import { type UIMessage } from "ai";
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

  const lastTwoMessages = messages.slice(-2);

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
