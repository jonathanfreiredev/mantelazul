import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "~/server/better-auth";
import { DropdownAvatarMenu } from "./dropdown-avatar-menu";
import { Logo } from "./logo";
import { SidebarDrawer } from "./sidebar-drawer";
import { SignInOrSignUpButton } from "./sign-in-or-sign-up-button";

export async function Header() {
  const resHeaders = await headers();
  const session = await auth.api.getSession({ headers: resHeaders });

  const isLoggedIn = !!session?.session;

  return (
    <header className="h-24 px-6">
      <div className="flex h-full w-full items-center justify-between">
        <Link href="/" passHref className="h-full">
          <h1 className="relative h-full w-40">
            <Logo />
          </h1>
        </Link>

        <div className="hidden items-end gap-2 sm:flex">
          {isLoggedIn ? (
            <DropdownAvatarMenu user={{ name: session.user.name }} />
          ) : (
            <SignInOrSignUpButton />
          )}
        </div>

        <div className="flex items-end gap-2 sm:hidden">
          <SidebarDrawer />
        </div>
      </div>
    </header>
  );
}
