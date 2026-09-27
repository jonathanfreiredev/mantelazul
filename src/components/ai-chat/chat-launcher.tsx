"use client";

import dynamic from "next/dynamic";
import type { MyAgentUIMessage } from "~/lib/agent";

/**
 * The assistant pulls in the transcript renderer, the HEIC converter and the image compressor:
 * several megabytes that a visitor who is not signed in never touches. Going through a dynamic
 * import keeps that whole graph out of the route, so the public pages do not pay for it.
 */
const AIAgentChat = dynamic(() => import("./ai-agent-chat"), { ssr: false });

interface ChatLauncherProps {
  chatId: string;
  messages: MyAgentUIMessage[];
  voiceEnabled: boolean;
}

export function ChatLauncher({
  chatId,
  messages,
  voiceEnabled,
}: ChatLauncherProps) {
  return (
    <AIAgentChat
      chatId={chatId}
      messages={messages}
      voiceEnabled={voiceEnabled}
    />
  );
}
