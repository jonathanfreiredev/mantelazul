import { createId } from "@paralleldrive/cuid2";
import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { createAgent } from "~/lib/agent";
import { todayIso } from "~/lib/dates";
import { saveChat } from "~/lib/save-chat";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";

export const maxDuration = 300;

export async function POST(req: Request) {
  // The session decides who is asking. It used to be a header the caller set, which meant anyone
  // could chat as anyone else just by writing a different user id.
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const { messages, id }: { messages: UIMessage[]; id: string } =
    await req.json();

  // The agent needs the current date to resolve "next week", and the household to know whether
  // sharing a meal is even possible.
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { household: { select: { name: true } } },
  });

  const agent = createAgent({
    today: todayIso(),
    householdName: user?.household?.name ?? null,
    attachedImageUrl: latestAttachedImageUrl(messages),
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    generateMessageId: () => createId(),
    onEnd: async ({ messages }) => {
      await saveChat(messages, id, userId);
    },
  });
}

/**
 * URL of the image the user attached, taken from the most recent message that carries one. The
 * image is uploaded to Cloudinary before the message is sent, so this is a plain https URL the
 * recipe tools can use as a cover. The search walks the whole conversation, not just the last
 * message: the user often attaches the photo first and asks to use it a message later.
 */
function latestAttachedImageUrl(messages: UIMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;

    for (const part of message.parts) {
      if (part.type === "file" && part.mediaType.startsWith("image/")) {
        return part.url;
      }
    }
  }

  return null;
}
