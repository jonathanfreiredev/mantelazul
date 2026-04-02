import { createId } from "@paralleldrive/cuid2";
import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { headers } from "next/headers";
import { agent } from "~/lib/agent";
import { saveChat } from "~/lib/save-chat";

export const maxDuration = 300;

export async function POST(req: Request) {
  const headersList = await headers();
  const userId = headersList.get("X-User-ID");

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, id }: { messages: UIMessage[]; id: string } =
    await req.json();

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    generateMessageId: () => createId(),
    onFinish: async ({ messages }) => {
      await saveChat(messages, id, userId);
    },
  });
}

export async function PUT(req: Request) {
  console.log("PUT /api/chat called");
}
