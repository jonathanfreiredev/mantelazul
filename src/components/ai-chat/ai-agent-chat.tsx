"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  NotepadTextIcon,
  PaperclipIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useMediaQuery } from "~/hooks/use-media-query";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../ui/drawer";
import type { MyAgentUIMessage } from "~/lib/agent";
import { useRouter } from "next/navigation";
import { createId } from "@paralleldrive/cuid2";
import { motion } from "motion/react";

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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [opened, setOpened] = useState(false);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const router = useRouter();

  const {
    id,
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

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const shouldAutoScroll = () => {
    const el = containerRef.current;
    if (!el) return true;

    const threshold = 100; // px desde abajo
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  // Scroll to bottom when opening the chat
  useEffect(() => {
    if (opened) {
      setTimeout(() => scrollToBottom("auto"), 50);
    }
  }, [opened]);

  // Auto-scroll when new messages arrive, but only if the user is already near the bottom
  useEffect(() => {
    if (opened && shouldAutoScroll()) {
      scrollToBottom(status === "streaming" ? "auto" : "smooth");
    }
  }, [messages, status, opened]);

  useEffect(() => {
    if (!opened) return;

    const timeout = setTimeout(() => {
      const el = containerRef.current;

      if (!el) return;

      const handleScroll = () => {
        console.log("scrolling...");
        const threshold = 100;
        const atBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

        setIsAtBottom(atBottom);
      };

      el.addEventListener("scroll", handleScroll);

      return () => {
        el.removeEventListener("scroll", handleScroll);
      };
    }, 100);

    return () => clearTimeout(timeout);
  }, [opened]);

  console.log({ id, messages });

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

      {!opened ? (
        <div className="fixed right-0 bottom-0 left-0 z-50 mx-auto w-full max-w-2xl px-4 py-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setInput("");
              setOpened(true);
              sendMessage({ text: input });
            }}
          >
            <div className="flex gap-2 rounded-lg border border-zinc-300 bg-white/30 px-4 py-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <input
                className="w-full py-2 outline-none"
                value={input}
                placeholder="Say something..."
                onFocus={() => {
                  if (messages.length > 0) {
                    setOpened(true);
                  }
                }}
                onChange={(e) => setInput(e.currentTarget.value)}
              />
              <div className="flex items-center justify-between">
                {status === "streaming" || status === "submitted" ? (
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full"
                    onClick={stop}
                  >
                    <SquareIcon fill="white" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full"
                    type="submit"
                    disabled={input.trim() === ""}
                  >
                    <ArrowUpIcon />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        <Drawer
          direction={isDesktop ? "right" : "bottom"}
          open={opened}
          onOpenChange={(open) => setOpened(open)}
        >
          <DrawerContent className="w-full">
            <DrawerHeader>
              <DrawerTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-normal">
                    <SparklesIcon size="20" strokeWidth={1.5} /> Assistant
                  </div>

                  {messages.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        disabled={
                          deleteChat.isPending ||
                          status === "streaming" ||
                          status === "submitted"
                        }
                        onClick={() => deleteChat.mutate()}
                      >
                        <Trash2Icon size="20" strokeWidth={1.5} />
                      </Button>
                    </div>
                  )}
                </div>
              </DrawerTitle>
            </DrawerHeader>
            <DrawerDescription className="sr-only">
              The assistant can help you with a variety of tasks, such as
              answering questions, providing recommendations, and creating
              recipes.
            </DrawerDescription>

            <div className="relative flex min-h-[30vh] flex-col px-4">
              <div
                ref={containerRef}
                className="no-scrollbar flex h-full flex-col gap-4 overflow-y-auto"
              >
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      } mb-4`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-neutral-600 text-white"
                            : "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">
                          <p className="mb-1 text-xs font-extralight opacity-70">
                            {message.role === "user" ? "YOU " : "AI "}
                          </p>
                          {message.parts.map((part, i) => {
                            switch (part.type) {
                              case "text":
                                return (
                                  <div key={`${message.id}-${i}`}>
                                    {part.text}
                                  </div>
                                );
                              case "tool-createRecipe":
                              case "tool-updateRecipe": {
                                switch (part.state) {
                                  case "approval-requested":
                                    return (
                                      <div key={part.toolCallId}>
                                        <p className="mb-2">
                                          Do you approve{" "}
                                          {part.type === "tool-createRecipe"
                                            ? "creating"
                                            : "updating"}{" "}
                                          the following recipe:{" "}
                                          {part.input.title}?
                                        </p>

                                        <div className="flex gap-2">
                                          <Button
                                            variant="default"
                                            onClick={async () => {
                                              addToolApprovalResponse({
                                                id: part.approval.id,
                                                approved: true,
                                              });
                                            }}
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() =>
                                              addToolApprovalResponse({
                                                id: part.approval.id,
                                                approved: false,
                                              })
                                            }
                                          >
                                            Deny
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  case "output-available":
                                    // Show the output of the tool call and a button link to view the recipe
                                    return (
                                      <div
                                        key={part.toolCallId}
                                        className="mb-5 flex flex-col gap-4 rounded-lg border border-slate-300 bg-slate-100 p-4"
                                      >
                                        <p>
                                          Recipe "{part.output.recipe.title}"
                                          {part.type === "tool-createRecipe"
                                            ? "created"
                                            : "updated"}{" "}
                                          successfully!
                                        </p>
                                        <Button
                                          variant="outline"
                                          onClick={() =>
                                            router.push(
                                              `/recipes/${part.output.recipe.slug}`,
                                            )
                                          }
                                        >
                                          <NotepadTextIcon /> View Recipe
                                        </Button>
                                      </div>
                                    );
                                  case "output-denied":
                                    return (
                                      <div
                                        key={part.toolCallId}
                                        className="mb-5 flex flex-col gap-4 rounded-lg border border-red-300 bg-red-100 p-4"
                                      >
                                        <p>
                                          Recipe{" "}
                                          {part.type === "tool-createRecipe"
                                            ? "creation"
                                            : "update"}{" "}
                                          denied. The assistant will try to find
                                          another solution.
                                        </p>
                                      </div>
                                    );
                                }
                              }
                            }
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-4 pt-10">
                    <p className="text-center text-sm text-neutral-500">
                      The assistant can help you with a variety of tasks, such
                      as answering questions, providing recommendations, and
                      creating recipes.
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
            </div>

            <DrawerFooter>
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 px-4 py-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setInput("");
                    sendMessage({ text: input });
                  }}
                >
                  <input
                    className="w-full py-2 outline-none"
                    value={input}
                    placeholder="Say something..."
                    onChange={(e) => setInput(e.currentTarget.value)}
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <PaperclipIcon />
                    </Button>
                    {status === "streaming" || status === "submitted" ? (
                      <Button
                        variant="default"
                        size="icon"
                        className="rounded-full"
                        onClick={stop}
                      >
                        <SquareIcon fill="white" />
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="icon"
                        className="rounded-full"
                        type="submit"
                        disabled={input.trim() === ""}
                      >
                        <ArrowUpIcon />
                      </Button>
                    )}
                  </div>
                </form>{" "}
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
