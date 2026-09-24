import { getSession } from "~/server/better-auth/server";
import { Link } from "~/i18n/navigation";
import { DropdownAvatarMenu } from "./dropdown-avatar-menu";
import { Logo } from "./logo";
import { SidebarDrawer } from "./sidebar-drawer";
import { SignInOrSignUpButton } from "./auth/sign-in-or-sign-up-button";
import { LocaleSwitcher } from "./locale-switcher";
import AIAgentChat from "./ai-chat/ai-agent-chat";
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
    <header className="h-24 px-6">
      <div className="flex h-full w-full items-center justify-between">
        <Link href="/" passHref className="h-full">
          <h1 className="relative h-full w-40">
            <Logo />
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />

          <div className="hidden sm:flex">
            {isLoggedIn ? (
              <DropdownAvatarMenu user={{ name: session.user.name }} />
            ) : (
              <SignInOrSignUpButton />
            )}
          </div>

          <div className="flex sm:hidden">
            <SidebarDrawer isLoggedIn={isLoggedIn} />
          </div>

          {!!isLoggedIn && (
            <AIAgentChat
              userId={session.user.id}
              chatId={chatId || createId()}
              messages={messages}
            />
          )}
        </div>
      </div>
    </header>
  );
}
