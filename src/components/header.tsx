import { getSession } from "~/server/better-auth/server";
import { voiceDictationEnabled } from "~/server/transcription";
import { Link } from "~/i18n/navigation";
import { DropdownAvatarMenu } from "./dropdown-avatar-menu";
import { Logo } from "./logo";
import { SidebarDrawer } from "./sidebar-drawer";
import { SignInOrSignUpButton } from "./auth/sign-in-or-sign-up-button";
import { LocaleSwitcher } from "./locale-switcher";
import { ChatLauncher } from "./ai-chat/chat-launcher";
import { api } from "~/trpc/server";
import { createId } from "@paralleldrive/cuid2";
import type { MyAgentUIMessage } from "~/lib/agent";

export async function Header() {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  let chatId = null;

  const messages: MyAgentUIMessage[] = [];

  if (isLoggedIn) {
    const chat = await api.aiChat.getChatId();

    chatId = chat.chatId;
  }

  if (isLoggedIn && chatId) {
    const { messages: chatMessages } = await api.aiChat.getMessages({ chatId });

    messages.push(...chatMessages);
  }

  return (
    // Solid background, not a blur: a backdrop filter on this sticky element would become the
    // containing block of the fixed chat panel and stop it from covering the screen.
    <header className="bg-background sticky top-0 z-40 h-24 shrink-0 border-b px-6">
      <div className="flex h-full w-full items-center justify-between">
        <Link href="/everything" passHref className="h-full">
          <h1 className="relative h-full w-40">
            <Logo />
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <LocaleSwitcher />

            {isLoggedIn ? (
              <DropdownAvatarMenu user={{ name: session.user.name }} />
            ) : (
              <SignInOrSignUpButton />
            )}
          </div>

          <div className="flex sm:hidden">
            <SidebarDrawer isLoggedIn={isLoggedIn} />
          </div>

          <ChatLauncher
            chatId={chatId || createId()}
            messages={messages}
            isLoggedIn={isLoggedIn}
            voiceEnabled={voiceDictationEnabled}
          />
        </div>
      </div>
    </header>
  );
}
