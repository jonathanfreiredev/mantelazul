"use client";

import { useChat } from "@ai-sdk/react";
import { createId } from "@paralleldrive/cuid2";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { ArrowDownIcon, SparklesIcon, Trash2Icon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

const MAX_MESSAGES = 25;
const BOTTOM_THRESHOLD_PX = 100;
const SCROLL_TO_BOTTOM_DELAY_MS = 50;
const SCROLL_LISTENER_ATTACH_DELAY_MS = 100;
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
  userId: string;
  chatId: string | null;
  messages: MyAgentUIMessage[];
}

export default function AIAgentChat({
  userId,
  chatId,
  messages: savedMessages,
}: AIAgentChatProps) {
  const [attachedImage, setAttachedImage] = useState<ImageWithPreview | null>(
    null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      headers: () => ({
        "X-User-ID": userId,
      }),
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
   * What the assistant is doing right now, so the last message can show a status chip.
   * The last message is always an assistant message while the agent is busy, including
   * every intermediate step of a tool loop, so the chip stays visible across steps.
   */
  let activity: AssistantActivity | null = null;
  if (isBusy) {
    if (status === "submitted") {
      activity = { kind: "thinking" };
    } else if (hasActivelyStreamingText(lastMessage)) {
      activity = { kind: "typing" };
    } else {
      activity = { kind: "working" };
    }
  }

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const shouldAutoScroll = () => {
    const el = containerRef.current;
    if (!el) return true;

    return (
      el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD_PX
    );
  };

  // Scroll to bottom when opening the chat.
  useEffect(() => {
    if (!opened) return;

    const timeout = setTimeout(
      () => scrollToBottom("auto"),
      SCROLL_TO_BOTTOM_DELAY_MS,
    );

    return () => clearTimeout(timeout);
  }, [opened]);

  // Auto-scroll when new messages arrive, but only if the user is near the bottom.
  useEffect(() => {
    if (opened && shouldAutoScroll()) {
      scrollToBottom(status === "streaming" ? "auto" : "smooth");
    }
  }, [messages, status, opened, uploadingImage]);

  // Track whether the user is at the bottom, to toggle the scroll-to-bottom button.
  useEffect(() => {
    if (!opened) return;

    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      setIsAtBottom(shouldAutoScroll());
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [opened]);

  const handleSendMessage = async (text: string) => {
    if (text.trim() === "" || isBusy || isAtMessageLimit) return;

    let imageUrl: string | null = null;

    if (attachedImage && attachedImage.file.size > MAX_ATTACHED_IMAGE_BYTES) {
      console.error("Attached image exceeds the 10MB limit");
      return;
    }

    if (attachedImage) {
      setUploadingImage(true);

      try {
        const formData = new FormData();
        formData.append("file", attachedImage.file);

        const response = await fetch("/api/images/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          console.error("Image upload failed");
          return;
        }

        const resImage: { url: string } = await response.json();
        imageUrl = resImage.url;
      } finally {
        setUploadingImage(false);
      }
    }

    sendMessage({
      role: "user",
      parts: [
        { type: "text", text },
        ...(imageUrl
          ? [
              {
                type: "file" as const,
                mediaType: "image/png",
                url: imageUrl,
              },
            ]
          : []),
      ],
    });

    setInput("");
    setAttachedImage(null);
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
          onClick={() => setOpened(true)}
        >
          <SparklesIcon className="text-2xl text-slate-500" />
        </Button>

        <div className="fixed right-0 bottom-0 left-0 z-50 mx-auto w-full max-w-2xl px-4 py-6">
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
              attachedImage={attachedImage}
              onAttachedImageChange={setAttachedImage}
              showAttachButton={false}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <Drawer
      direction={isDesktop ? "right" : "bottom"}
      open={opened}
      onOpenChange={setOpened}
    >
      <DrawerContent className="w-full">
        <DrawerHeader>
          <DrawerTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-normal">
                <SparklesIcon size="20" strokeWidth={1.5} /> Assistant
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
          The assistant can help you with a variety of tasks, such as answering
          questions, providing recommendations, and creating recipes.
        </DrawerDescription>

        <div className="relative flex min-h-40 flex-col px-4">
          <div
            ref={containerRef}
            className="no-scrollbar flex h-full flex-col gap-4 overflow-y-auto"
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
              <div className="flex flex-col items-center gap-4 pt-10">
                <p className="text-center text-sm text-neutral-500">
                  The assistant can help you with a variety of tasks, such as
                  answering questions, providing recommendations, and creating
                  recipes.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
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
                onClick={() => scrollToBottom("smooth")}
              >
                <ArrowDownIcon />
              </Button>
            </motion.div>
          )}

          {attachedImage && (
            <div className="absolute bottom-1 z-100 h-32 w-32 overflow-hidden rounded-sm bg-gray-100 shadow-lg shadow-gray-500/50">
              <div className="relative h-full w-full">
                <Button
                  variant="default"
                  size="icon"
                  className="absolute top-1 right-1 z-10 rounded-full"
                  onClick={() => setAttachedImage(null)}
                >
                  <XIcon size="16" />
                </Button>
                <Image
                  src={attachedImage.preview}
                  alt="Attached image preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {isAtMessageLimit && (
            <motion.div
              key="limit-exceeded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute bottom-3 z-100 w-[90%] rounded-md border-2 border-red-400/30 bg-red-100 px-4 py-2 shadow-lg shadow-gray-400/50"
            >
              <p className="text-sm text-red-700">
                Message limit exceeded. Please delete the chat to start a new
                conversation.
              </p>
            </motion.div>
          )}
        </div>

        <DrawerFooter>
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => void handleSendMessage(input)}
            onStop={stop}
            isBusy={isBusy}
            disabled={uploadingImage || isAtMessageLimit}
            attachedImage={attachedImage}
            onAttachedImageChange={setAttachedImage}
            showAttachButton
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
