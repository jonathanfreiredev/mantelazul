"use client";

import { useChat } from "@ai-sdk/react";
import { createId } from "@paralleldrive/cuid2";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import {
  ArrowDownIcon,
  LockKeyholeIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMediaQuery } from "~/hooks/use-media-query";
import { useVisualViewport } from "~/hooks/use-visual-viewport";
import { Link, usePathname } from "~/i18n/navigation";
import type { MyAgentUIMessage } from "~/lib/agent";
import { api } from "~/trpc/react";
import type { ImageWithPreview } from "../image-uploader/image-upload";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../ui/drawer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../ui/message-scroller";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { type AssistantActivity } from "./assistant-activity-indicator";
import { isRunningToolPart, toolNameOf } from "./tools/tool-part";

const MAX_ATTACHED_IMAGES = 3;
const MAX_ATTACHED_IMAGE_BYTES = 10 * 1024 * 1024;

/** Desktop gets the side drawer; phones and tablets get the full-screen panel. */
const DESKTOP_QUERY =
  "(min-width: 768px) and (hover: hover) and (pointer: fine)";

/**
 * A text part is still being appended while it is the last part of the message; once the
 * agent moves on (another part follows, or the step ends) it is no longer "typing".
 */
function hasActivelyStreamingText(
  message: MyAgentUIMessage | undefined,
): boolean {
  if (!message) return false;

  const lastPart = message.parts[message.parts.length - 1];
  return lastPart?.type === "text";
}

interface AIAgentChatProps {
  chatId: string | null;
  messages: MyAgentUIMessage[];
  /** Dictation is hidden when no transcription provider is configured. */
  voiceEnabled: boolean;
  /** Guests can open the assistant, but only see the sign-in prompt. */
  isLoggedIn: boolean;
  open: boolean;
  onClose: () => void;
}

export default function AIAgentChat({
  chatId,
  messages: savedMessages,
  voiceEnabled,
  isLoggedIn,
  open,
  onClose,
}: AIAgentChatProps) {
  const t = useTranslations("Chat");
  const [attachedImages, setAttachedImages] = useState<ImageWithPreview[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [input, setInput] = useState("");

  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { height, offsetTop, keyboardInset } = useVisualViewport(
    !isDesktop && open,
  );

  const {
    messages,
    status,
    sendMessage,
    setMessages,
    stop,
    addToolApprovalResponse,
  } = useChat<MyAgentUIMessage>({
    id: chatId || undefined,
    generateId: () => createId(),
    messages: savedMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // The server keeps the canonical history; sending the whole transcript every turn would
      // grow with the conversation and hit request-size limits. Send only what the server cannot
      // know: the new user message, plus any assistant messages carrying an approval response.
      prepareSendMessagesRequest: ({ id, messages }) => {
        const last = messages[messages.length - 1];
        const withApprovals = messages.filter((message) =>
          message.parts.some(
            (part) =>
              part.type.startsWith("tool-") &&
              (part as { state?: string }).state === "approval-responded",
          ),
        );

        const outgoing = [
          ...withApprovals,
          ...(last?.role === "user" ? [last] : []),
        ];
        const seen = new Set<string>();

        return {
          body: {
            id,
            messages: outgoing.filter((message) => {
              if (seen.has(message.id)) return false;
              seen.add(message.id);
              return true;
            }),
          },
        };
      },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const deleteChat = api.aiChat.delete.useMutation({
    onSuccess: () => {
      setMessages([]);
    },
  });

  const isBusy = status === "streaming" || status === "submitted";
  const lastMessage = messages[messages.length - 1];

  /**
   * What the assistant is doing right now, so the last message can say it in one line. While a
   * tool runs the line names that tool; the rest of the time the model is the one working, either
   * writing its answer (nothing to announce, the words themselves are the feedback) or deciding
   * what to do next. The last message is an assistant message while the agent is busy, including
   * every intermediate step of a tool loop, so the line stays visible across steps.
   */
  let activity: AssistantActivity | null = null;
  if (isBusy) {
    const lastPart = lastMessage?.parts[lastMessage.parts.length - 1];
    const runningTool =
      lastPart && isRunningToolPart(lastPart) ? toolNameOf(lastPart) : null;
    const assistantIsTyping =
      lastMessage?.role === "assistant" &&
      hasActivelyStreamingText(lastMessage);

    if (runningTool) {
      activity = { kind: "tool", tool: runningTool };
    } else if (!assistantIsTyping) {
      activity = { kind: "thinking" };
    }
  }

  // On phones the chat is a full-screen panel, so the page behind it must not scroll while it is
  // open. Without this, iOS can still move the document when the keyboard appears.
  useEffect(() => {
    if (isDesktop || !open) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll =
      document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overscrollBehavior = previousOverscroll;
    };
  }, [isDesktop, open]);

  // The component stays mounted after the first open so `useChat` keeps the conversation, but
  // there is nothing to paint while the sheet is closed.
  if (!open) return null;

  /** Closing the panel also closes the keyboard: otherwise it stays open over a closed chat. */
  const closeChat = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  const handleSendMessage = async (text: string) => {
    if (text.trim() === "" || isBusy) return;

    if (
      attachedImages.some((image) => image.file.size > MAX_ATTACHED_IMAGE_BYTES)
    ) {
      toast.error(t("imageTooLarge"));
      return;
    }

    let attachments: { url: string; mediaType: string }[] = [];

    if (attachedImages.length > 0) {
      setUploadingImage(true);

      try {
        attachments = await Promise.all(
          attachedImages.map(async (image) => {
            const formData = new FormData();
            formData.append("file", image.file);

            const response = await fetch("/api/images/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) throw new Error("upload failed");

            const resImage: { url: string } = await response.json();
            return {
              url: resImage.url,
              // The real type of the processed file (WebP, or JPEG when the conversion
              // failed). A hardcoded one makes the model read the image as something it is not.
              mediaType: image.file.type || "image/jpeg",
            };
          }),
        );
      } catch {
        toast.error(t("imageUploadFailed"));
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    sendMessage({
      role: "user",
      parts: [
        { type: "text", text },
        ...attachments.map((attachment) => ({
          type: "file" as const,
          mediaType: attachment.mediaType,
          url: attachment.url,
        })),
      ],
    });

    setInput("");
    setAttachedImages([]);
  };

  const handleApprove = (approvalId: string) => {
    addToolApprovalResponse({ id: approvalId, approved: true });
  };

  const handleDeny = (approvalId: string) => {
    addToolApprovalResponse({ id: approvalId, approved: false });
  };

  const activityFor = (messageId: string): AssistantActivity | null =>
    messageId === lastMessage?.id ? activity : null;

  const submit = () => {
    void handleSendMessage(input);
  };

  const chatInput = (
    <ChatInput
      value={input}
      onChange={setInput}
      onSubmit={submit}
      onStop={stop}
      isBusy={isBusy}
      disabled={uploadingImage}
      attachedImages={attachedImages}
      onAttachedImagesChange={setAttachedImages}
      maxAttachedImages={MAX_ATTACHED_IMAGES}
      showAttachButton
      voiceEnabled={voiceEnabled}
    />
  );

  const header = (
    <ChatHeader
      messageCount={messages.length}
      canDelete={isLoggedIn}
      deleteDisabled={deleteChat.isPending || isBusy}
      onDelete={() => deleteChat.mutate()}
      onClose={closeChat}
      asDrawerTitle={isDesktop}
    />
  );

  if (isDesktop) {
    return (
      <Drawer
        open
        direction="right"
        onOpenChange={(next) => {
          if (!next) closeChat();
        }}
      >
        <DrawerContent className="w-full overflow-clip data-[vaul-drawer-direction=right]:sm:max-w-md">
          <DrawerDescription className="sr-only">
            {t("description")}
          </DrawerDescription>
          {header}

          {isLoggedIn ? (
            <ChatTranscript
              messages={messages}
              activityFor={activityFor}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onNavigate={closeChat}
            />
          ) : (
            <LockedTranscript />
          )}

          {isLoggedIn && (
            <div className="shrink-0 px-4 pt-2 pb-4" data-chat-composer>
              {chatInput}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="bg-background fixed inset-x-0 z-50 flex flex-col"
      style={{
        top: offsetTop,
        height: height ?? "100dvh",
      }}
    >
      {header}

      {isLoggedIn ? (
        <ChatTranscript
          messages={messages}
          activityFor={activityFor}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onNavigate={closeChat}
        />
      ) : (
        <LockedTranscript />
      )}

      {isLoggedIn && (
        <div
          data-chat-composer
          className="shrink-0 px-3 pt-2"
          style={{
            paddingBottom:
              keyboardInset > 0 ? 8 : "max(12px, env(safe-area-inset-bottom))",
          }}
        >
          {chatInput}
        </div>
      )}
    </div>
  );
}

/** What a guest sees instead of the transcript: the assistant is locked until they sign in. */
function LockedTranscript() {
  const t = useTranslations("Chat");
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <Empty className="border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockKeyholeIcon />
          </EmptyMedia>
          <EmptyTitle>{t("loginRequiredTitle")}</EmptyTitle>
          <EmptyDescription>{t("loginRequiredDescription")}</EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
                {t("loginRequiredCta")}
              </Link>
            </Button>
          </EmptyContent>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

interface ChatHeaderProps {
  messageCount: number;
  canDelete: boolean;
  deleteDisabled: boolean;
  onDelete: () => void;
  onClose: () => void;
  asDrawerTitle: boolean;
}

function ChatHeader({
  messageCount,
  canDelete,
  deleteDisabled,
  onDelete,
  onClose,
  asDrawerTitle,
}: ChatHeaderProps) {
  const t = useTranslations("Chat");

  const title = (
    <>
      <SparklesIcon size={20} strokeWidth={1.5} />
      {t("title")}
    </>
  );

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
      {asDrawerTitle ? (
        <DrawerTitle className="flex items-center gap-2 text-lg font-normal">
          {title}
        </DrawerTitle>
      ) : (
        <h2 className="flex items-center gap-2 text-lg font-normal">{title}</h2>
      )}

      <div className="flex items-center gap-1">
        {canDelete && messageCount > 0 && (
          <Button
            variant="ghost"
            size="icon-lg"
            disabled={deleteDisabled}
            aria-label={t("deleteChat")}
            title={t("deleteChat")}
            onClick={onDelete}
          >
            <Trash2Icon size={20} strokeWidth={1.5} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("closeChat")}
          title={t("closeChat")}
          onClick={onClose}
        >
          <XIcon size={20} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

interface ChatTranscriptProps {
  messages: MyAgentUIMessage[];
  activityFor: (messageId: string) => AssistantActivity | null;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  onNavigate: () => void;
}

function ChatTranscript({
  messages,
  activityFor,
  onApprove,
  onDeny,
  onNavigate,
}: ChatTranscriptProps) {
  const t = useTranslations("Chat");

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {messages.length > 0 ? (
        <MessageScrollerProvider
          autoScroll
          defaultScrollPosition="last-anchor"
          scrollPreviousItemPeek={64}
        >
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent className="px-4 py-2">
                {messages.map((message) => (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={message.role === "user"}
                  >
                    <ChatMessage
                      message={message}
                      activity={activityFor(message.id)}
                      onApprove={onApprove}
                      onDeny={onDeny}
                      onNavigate={onNavigate}
                    />
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>

            <MessageScrollerButton>
              <ArrowDownIcon />
              <span className="sr-only">{t("scrollToLatest")}</span>
            </MessageScrollerButton>
          </MessageScroller>
        </MessageScrollerProvider>
      ) : (
        <Empty className="h-full px-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SparklesIcon />
            </EmptyMedia>
            <EmptyTitle>{t("title")}</EmptyTitle>
            <EmptyDescription>{t("description")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
