"use client";

import dynamic from "next/dynamic";
import { LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { MyAgentUIMessage } from "~/lib/agent";
import { Button } from "../ui/button";

/**
 * The assistant pulls in the transcript renderer, the HEIC converter and the image compressor:
 * several megabytes that a visitor who never opens the chat should not download. The chunk is
 * loaded on the first click, not when the header renders, and the component stays mounted after
 * that so closing and reopening keeps the conversation.
 */
const AIAgentChat = dynamic(() => import("./ai-agent-chat"), {
  ssr: false,
  loading: () => (
    <Button variant="outline" size="icon-lg" className="rounded-sm" disabled>
      <LoaderCircleIcon className="animate-spin" />
    </Button>
  ),
});

interface ChatLauncherProps {
  chatId: string | null;
  messages: MyAgentUIMessage[];
  isLoggedIn: boolean;
  voiceEnabled: boolean;
}

export function ChatLauncher({
  chatId,
  messages,
  isLoggedIn,
  voiceEnabled,
}: ChatLauncherProps) {
  const t = useTranslations("Chat");
  const [loaded, setLoaded] = useState(false);
  const [opened, setOpened] = useState(false);

  const open = () => {
    setLoaded(true);
    setOpened(true);
  };

  return (
    <>
      {!opened && (
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-sm"
          aria-label={t("title")}
          title={t("title")}
          onClick={open}
        >
          <SparklesIcon />
        </Button>
      )}

      {loaded && (
        <AIAgentChat
          chatId={chatId}
          messages={messages}
          isLoggedIn={isLoggedIn}
          voiceEnabled={voiceEnabled}
          open={opened}
          onClose={() => setOpened(false)}
        />
      )}
    </>
  );
}
