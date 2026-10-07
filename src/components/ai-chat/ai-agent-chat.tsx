"use client";

import { useChat } from "@ai-sdk/react";
import { createId } from "@paralleldrive/cuid2";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { ArrowDownIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMediaQuery } from "~/hooks/use-media-query";
import type { MyAgentUIMessage } from "~/lib/agent";
import { api } from "~/trpc/react";
import type { ImageWithPreview } from "../image-uploader/image-upload";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { type AssistantActivity } from "./assistant-activity-indicator";
import { isRunningToolPart, toolNameOf } from "./tools/tool-part";

const MAX_MESSAGES = 50;
/** Distance from the bottom within which the user is considered "at the bottom". */
const BOTTOM_THRESHOLD_PX = 80;
const MAX_ATTACHED_IMAGES = 3;
const MAX_ATTACHED_IMAGE_BYTES = 10 * 1024 * 1024;

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
}

export default function AIAgentChat({
  chatId,
  messages: savedMessages,
  voiceEnabled,
}: AIAgentChatProps) {
  const t = useTranslations("Chat");
  const [attachedImages, setAttachedImages] = useState<ImageWithPreview[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  /** Mirrors `isAtBottom` for the scroll effect, which must not re-run on every scroll. */
  const isPinnedToBottomRef = useRef(true);

  const isDesktop = useMediaQuery("(min-width: 768px)");

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
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const deleteChat = api.aiChat.delete.useMutation({
    onSuccess: () => {
      setMessages([]);
    },
  });

  const isBusy = status === "streaming" || status === "submitted";
  const isAtMessageLimit = messages.length > MAX_MESSAGES;
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

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const element = containerRef.current;
    if (!element) return;

    // Scroll the message list itself. `scrollIntoView` would also scroll every scrollable
    // ancestor, dragging the drawer's header and composer out of view.
    element.scrollTo({ top: element.scrollHeight, behavior });
  };

  const isNearBottom = () => {
    const element = containerRef.current;
    if (!element) return true;

    return (
      element.scrollHeight - element.scrollTop - element.clientHeight <
      BOTTOM_THRESHOLD_PX
    );
  };

  // Track whether the user is at the bottom, both in state (for the button) and in a ref
  // (for the scroll effect, so it does not re-run on every scroll event).
  useEffect(() => {
    if (!opened) return;

    const element = containerRef.current;
    if (!element) return;

    const handleScroll = () => {
      const nearBottom = isNearBottom();
      isPinnedToBottomRef.current = nearBottom;
      setIsAtBottom(nearBottom);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [opened]);

  // Keep the latest message in view while the assistant streams. The container grows on every
  // chunk (and tool step), which fires no scroll event, so we observe its height instead.
  useEffect(() => {
    if (!opened) return;

    const element = containerRef.current;
    if (!element) return;

    const followIfPinned = () => {
      if (isPinnedToBottomRef.current) scrollToBottom("auto");
    };

    const observer = new ResizeObserver(followIfPinned);
    observer.observe(element);

    // Pin to the bottom on open, and whenever a new message is sent.
    isPinnedToBottomRef.current = true;
    followIfPinned();

    return () => observer.disconnect();
  }, [opened, messages.length]);

  const handleSendMessage = async (text: string) => {
    if (text.trim() === "" || isBusy || isAtMessageLimit) return;

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

  if (!opened) {
    return (
      <>
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-sm border-slate-400"
          aria-label={t("title")}
          onClick={() => setOpened(true)}
        >
          <SparklesIcon className="text-2xl text-slate-500" />
        </Button>

        <div
          data-chat-composer
          className="fixed right-0 bottom-0 left-0 z-50 mx-auto w-full max-w-2xl px-3 pt-6 pb-5 md:px-4 md:py-6"
        >
          <div
            onFocus={() => {
              if (messages.length > 0) setOpened(true);
            }}
          >
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => {
                setOpened(true);
                if (!isAtMessageLimit) void handleSendMessage(input);
              }}
              onStop={stop}
              isBusy={isBusy}
              disabled={uploadingImage || isAtMessageLimit}
              attachedImages={attachedImages}
              onAttachedImagesChange={setAttachedImages}
              maxAttachedImages={MAX_ATTACHED_IMAGES}
              showAttachButton={false}
              voiceEnabled={voiceEnabled}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    // On phones the drawer has to make room for the software keyboard. Vaul does that itself by
    // watching the visual viewport; the desktop drawer has no keyboard to accommodate.
    // The content also re-enables text selection: vaul turns it off on hover+fine-pointer
    // devices to make dragging feel right, but the chat is read-only text meant to be copied.
    <Drawer
      direction={isDesktop ? "right" : "bottom"}
      open={opened}
      onOpenChange={setOpened}
      repositionInputs={!isDesktop}
    >
      <DrawerContent
        data-chat-composer
        className="w-full overflow-clip data-[vaul-drawer-direction=bottom]:h-[85dvh]"
        style={{ userSelect: "text", WebkitUserSelect: "text" }}
      >
        <DrawerHeader className="shrink-0">
          <DrawerTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-normal">
                <SparklesIcon size="20" strokeWidth={1.5} /> {t("title")}
              </div>

              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  disabled={deleteChat.isPending || isBusy}
                  onClick={() => deleteChat.mutate()}
                >
                  <Trash2Icon size="20" strokeWidth={1.5} />
                </Button>
              )}
            </div>
          </DrawerTitle>
        </DrawerHeader>
        <DrawerDescription className="sr-only">
          {t("description")}
        </DrawerDescription>

        <div className="relative flex min-h-0 flex-1 flex-col px-4">
          <div
            ref={containerRef}
            className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
          >
            {messages.length > 0 ? (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  activity={activityFor(message.id)}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onNavigate={() => setOpened(false)}
                />
              ))
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2">
                <p className="text-center text-sm text-neutral-500">
                  {t("description")}
                </p>
              </div>
            )}
          </div>

          {!isAtBottom && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute bottom-5 z-50 flex w-full"
            >
              <Button
                className="pointer-events-auto mx-auto rounded-full shadow-lg shadow-gray-500/50"
                size="icon-lg"
                variant="outline"
                onClick={() => {
                  isPinnedToBottomRef.current = true;
                  setIsAtBottom(true);
                  scrollToBottom("smooth");
                }}
              >
                <ArrowDownIcon />
              </Button>
            </motion.div>
          )}

          {isAtMessageLimit && (
            <motion.div
              key="limit-exceeded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute bottom-3 z-100 w-[90%] rounded-md border-2 border-red-400/30 bg-red-100 px-4 py-2 shadow-lg shadow-gray-400/50"
            >
              <p className="text-sm text-red-700">{t("limitExceeded")}</p>
            </motion.div>
          )}
        </div>

        <DrawerFooter className="shrink-0">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => void handleSendMessage(input)}
            onStop={stop}
            isBusy={isBusy}
            disabled={uploadingImage || isAtMessageLimit}
            attachedImages={attachedImages}
            onAttachedImagesChange={setAttachedImages}
            maxAttachedImages={MAX_ATTACHED_IMAGES}
            showAttachButton
            voiceEnabled={voiceEnabled}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
