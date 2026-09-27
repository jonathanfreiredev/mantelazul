import { createId } from "@paralleldrive/cuid2";
import { createAgentUIStreamResponse } from "ai";
import { createAgent, type MyAgentUIMessage } from "~/lib/agent";
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

  const { messages, id }: { messages: MyAgentUIMessage[]; id: string } =
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
    generatedImageUrl: latestGeneratedImageUrl(messages),
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
function latestAttachedImageUrl(messages: MyAgentUIMessage[]): string | null {
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

/**
 * URL of the last image generated for a recipe earlier in the conversation, if there is one.
 *
 * It seeds the agent's image holder so a recipe saved in a later message reuses the image instead
 * of paying for a second generation. The image tool writes the same holder during a request, so
 * an image generated and used in the same turn is found there.
 */
function latestGeneratedImageUrl(messages: MyAgentUIMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;

    for (const part of message.parts) {
      if (part.type !== "tool-generateRecipeImage") continue;
      if (part.state !== "output-available") continue;

      const output = part.output as { imageUrl?: string } | undefined;
      if (output?.imageUrl) return output.imageUrl;
    }
  }

  return null;
}
