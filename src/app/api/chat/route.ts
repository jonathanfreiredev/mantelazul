import { propagateAttributes } from "@langfuse/tracing";
import { createId } from "@paralleldrive/cuid2";
import {
  createAgentUIStreamResponse,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { getTranslations } from "next-intl/server";
import { after } from "next/server";
import z from "zod";
import { createAgent, type MyAgentUIMessage } from "~/lib/agent";
import { prepareChatContext } from "~/lib/chat-context";
import {
  ChatAccessError,
  ensureChat,
  loadChatMessages,
  saveAssistantText,
  saveChatMessages,
  saveUserMessage,
} from "~/lib/chat-history";
import { isOwnedCloudinaryUrl } from "~/lib/cloudinary-url";
import { todayIso } from "~/lib/dates";
import { checkMessageScope } from "~/lib/guardrails/scope";
import { checkRateLimit } from "~/lib/rate-limit";
import { flushTelemetry } from "~/instrumentation";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { getRequestLocale } from "~/server/translations/request-locale";

export const maxDuration = 300;

const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const MAX_CLIENT_MESSAGES = 500;
const MAX_MESSAGE_CHARS = 20_000;
const MAX_ATTACHED_IMAGES = 3;

const APPROVAL_TOOLS = new Set([
  "tool-createRecipe",
  "tool-updateRecipe",
  "tool-deleteRecipe",
  "tool-planMeals",
]);

const bodySchema = z.object({
  id: z.string().min(1).max(64),
  messages: z.array(z.unknown()).min(1).max(MAX_CLIENT_MESSAGES),
});

interface ApprovalUpdate {
  messageId: string;
  toolCallId: string;
  approvalId: string;
  approved: boolean;
  reason?: string;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return new Response("Payload too large", { status: 413 });
  }

  const locale = await getRequestLocale();
  const t = await getTranslations({ locale, namespace: "Chat" });

  const limit = await checkRateLimit(session.user.id, "chat");

  if (!limit.allowed) {
    return textStreamResponse(t("rateLimited"));
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return new Response("Invalid chat payload", { status: 400 });
  }

  const userId = session.user.id;
  const { id: chatId, messages: clientMessages } = parsed.data;

  let chat;
  try {
    chat = await ensureChat(chatId, userId);
  } catch (error) {
    if (error instanceof ChatAccessError) {
      return new Response("Not found", { status: 404 });
    }
    throw error;
  }

  let history = await loadChatMessages(chatId);

  const lastClientMessage = clientMessages[clientMessages.length - 1];
  const incomingUser = extractUserMessage(lastClientMessage);
  const approvals = extractApprovalUpdates(clientMessages, history);

  if (!incomingUser && approvals.length === 0) {
    return new Response("No new message", { status: 400 });
  }

  // Approval responses are merged only when the tool call exists in this user's stored history
  // and is still waiting. A forged approval for another conversation has nothing to merge into.
  if (approvals.length > 0) {
    history = await applyApprovals(history, approvals);
  }

  let newUserMessage: MyAgentUIMessage | null = null;

  if (incomingUser) {
    const previous = history[history.length - 1];

    // A retry after a failed stream sends the same user message again. Reuse the stored turn
    // instead of creating a duplicate.
    if (
      previous?.role === "user" &&
      sameParts(previous.parts, incomingUser.parts)
    ) {
      newUserMessage = previous;
    } else {
      newUserMessage = await saveUserMessage(chatId, incomingUser.parts);
      history = [...history, newUserMessage];
    }
  }

  if (incomingUser) {
    const verdict = await checkMessageScope({
      text: incomingUser.text,
      recentMessages: history.filter(
        (message) => message.id !== newUserMessage?.id,
      ),
    });

    if (!verdict.allowed) {
      console.info("[chat] blocked message", {
        userId,
        intent: verdict.intent,
      });

      await saveAssistantText(chatId, t("scopeRefusal"));
      return textStreamResponse(t("scopeRefusal"));
    }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { household: { select: { name: true } } },
  });

  const context = {
    userId,
    today: todayIso(),
    householdName: user?.household?.name ?? null,
    attachedImageUrl: latestAttachedImageUrl(history),
    generatedImageUrl: latestGeneratedImageUrl(history),
  };

  const prepared = await prepareChatContext({
    chatId,
    messages: history,
    memory: {
      summary: chat.summary,
      summaryUpToMessageId: chat.summaryUpToMessageId,
    },
    context,
  });

  const agent = createAgent({
    ...context,
    conversationSummary: prepared.summary,
  });

  // Next runs this once the response has finished. It is the only window left to flush: the
  // processor batches spans, and a serverless function freezes the moment the stream ends, so
  // without it the last turn of every conversation would be traced nowhere.
  after(() => flushTelemetry());

  return propagateAttributes(
    {
      traceName: "chat-message",
      userId,
      sessionId: chatId,
      tags: [process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development"],
    },
    () =>
      createAgentUIStreamResponse({
        agent,
        uiMessages: prepared.messages,
        generateMessageId: () => createId(),
        onEnd: async ({ messages }) => {
          // The ids on these messages were generated by the server or are the canonical stored
          // ids. The client's assistant/tool history is never passed to the agent.
          await saveChatMessages(chatId, messages as MyAgentUIMessage[]);
        },
      }),
  );
}

/** A canned assistant reply, streamed in the same protocol as the agent. */
function textStreamResponse(text: string): Response {
  const messageId = createId();
  const textId = createId();

  const stream = createUIMessageStream({
    generateId: () => messageId,
    execute: ({ writer }) => {
      writer.write({ type: "start", messageId });
      writer.write({ type: "text-start", id: textId });
      writer.write({ type: "text-delta", id: textId, delta: text });
      writer.write({ type: "text-end", id: textId });
      writer.write({ type: "finish", finishReason: "stop" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

interface IncomingUser {
  parts: MyAgentUIMessage["parts"];
  text: string;
}

/**
 * Reads only the parts a user message is allowed to carry: text and images. A client cannot
 * smuggle a tool call, an assistant turn or a system message into the new turn.
 */
function extractUserMessage(value: unknown): IncomingUser | null {
  const message = asRecord(value);
  if (!message || message.role !== "user" || !Array.isArray(message.parts)) {
    return null;
  }

  const parts: MyAgentUIMessage["parts"] = [];
  let text = "";
  let imageCount = 0;

  for (const rawPart of message.parts) {
    const part = asRecord(rawPart);
    if (!part) return null;

    if (part.type === "text" && typeof part.text === "string") {
      const content = part.text.slice(0, MAX_MESSAGE_CHARS);
      if (content.trim().length === 0) continue;
      text = `${text} ${content}`.trim();
      if (text.length > MAX_MESSAGE_CHARS) return null;
      parts.push({ type: "text", text: content });
      continue;
    }

    if (part.type === "file") {
      if (
        typeof part.url !== "string" ||
        typeof part.mediaType !== "string" ||
        !part.mediaType.startsWith("image/") ||
        !isOwnedCloudinaryUrl(part.url)
      ) {
        return null;
      }

      imageCount += 1;
      if (imageCount > MAX_ATTACHED_IMAGES) return null;

      parts.push({
        type: "file",
        url: part.url,
        mediaType: part.mediaType,
        ...(typeof part.filename === "string"
          ? { filename: part.filename.slice(0, 255) }
          : {}),
      });
      continue;
    }

    // Anything else in a user message is not part of the supported protocol.
    return null;
  }

  if (parts.length === 0) return null;

  return { parts, text };
}

/**
 * Finds approval responses in the client history and matches each one to a pending tool call in
 * the stored history. The client can answer an approval, but it cannot invent the tool call, its
 * input or the conversation it belongs to.
 */
function extractApprovalUpdates(
  clientMessages: unknown[],
  history: MyAgentUIMessage[],
): ApprovalUpdate[] {
  const storedById = new Map(history.map((message) => [message.id, message]));
  const updates: ApprovalUpdate[] = [];

  for (const rawMessage of clientMessages) {
    const message = asRecord(rawMessage);
    if (
      !message ||
      message.role !== "assistant" ||
      typeof message.id !== "string" ||
      !Array.isArray(message.parts)
    ) {
      continue;
    }

    const stored = storedById.get(message.id);
    if (!stored) continue;

    for (const rawPart of message.parts) {
      const part = asRecord(rawPart);
      if (
        !part ||
        typeof part.type !== "string" ||
        !APPROVAL_TOOLS.has(part.type) ||
        part.state !== "approval-responded" ||
        typeof part.toolCallId !== "string"
      ) {
        continue;
      }

      const approval = asRecord(part.approval);
      if (
        !approval ||
        typeof approval.id !== "string" ||
        typeof approval.approved !== "boolean"
      ) {
        continue;
      }

      const storedPart = stored.parts.find((candidate) => {
        const record = candidate as unknown as Record<string, unknown>;

        return (
          record.type === part.type && record.toolCallId === part.toolCallId
        );
      });

      if (!storedPart) continue;

      const storedRecord = storedPart as unknown as Record<string, unknown>;
      const storedApproval = asRecord(storedRecord.approval);

      if (
        storedRecord.state !== "approval-requested" ||
        storedApproval?.id !== approval.id
      ) {
        continue;
      }

      updates.push({
        messageId: message.id,
        toolCallId: part.toolCallId,
        approvalId: approval.id,
        approved: approval.approved,
        ...(typeof approval.reason === "string"
          ? { reason: approval.reason.slice(0, 500) }
          : {}),
      });
    }
  }

  return updates;
}

async function applyApprovals(
  history: MyAgentUIMessage[],
  updates: ApprovalUpdate[],
): Promise<MyAgentUIMessage[]> {
  const byMessage = new Map<string, ApprovalUpdate[]>();

  for (const update of updates) {
    const list = byMessage.get(update.messageId) ?? [];
    list.push(update);
    byMessage.set(update.messageId, list);
  }

  const next = history.map((message) => {
    const messageUpdates = byMessage.get(message.id);
    if (!messageUpdates) return message;

    const parts = message.parts.map((part) => {
      const record = part as unknown as Record<string, unknown>;
      const update = messageUpdates.find(
        (candidate) => candidate.toolCallId === record.toolCallId,
      );

      if (!update) return part;

      const approval = asRecord(record.approval);

      return {
        ...record,
        state: "approval-responded",
        approval: {
          ...approval,
          approved: update.approved,
          ...(update.reason ? { reason: update.reason } : {}),
        },
      } as unknown as MyAgentUIMessage["parts"][number];
    });

    return { ...message, parts } as MyAgentUIMessage;
  });

  // The approval state is kept in memory and persisted by `onEnd` with the rest of the turn. If
  // the stream fails before that, the database still says "approval-requested" and the user can
  // answer it again instead of being stuck with an approval that never ran.
  return next;
}

function sameParts(
  left: MyAgentUIMessage["parts"],
  right: MyAgentUIMessage["parts"],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** URL of the image the user attached, taken from the most recent message that carries one. */
function latestAttachedImageUrl(messages: MyAgentUIMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;

    for (const part of message.parts) {
      if (
        part.type === "file" &&
        part.mediaType.startsWith("image/") &&
        isOwnedCloudinaryUrl(part.url)
      ) {
        return part.url;
      }
    }
  }

  return null;
}

/**
 * URL of the last image generated for a recipe earlier in the conversation, if there is one.
 * The image tool writes the same holder during a request, so an image generated and used in the
 * same turn is found there.
 */
function latestGeneratedImageUrl(messages: MyAgentUIMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;

    for (const part of message.parts) {
      if (part.type !== "tool-generateRecipeImage") continue;
      if (part.state !== "output-available") continue;

      const output = part.output as { imageUrl?: string } | undefined;
      if (isOwnedCloudinaryUrl(output?.imageUrl)) return output.imageUrl;
    }
  }

  return null;
}
