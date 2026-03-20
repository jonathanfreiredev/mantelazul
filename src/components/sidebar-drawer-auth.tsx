"use client";
import { LogInIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "~/server/better-auth/client";
import { Item, ItemContent, ItemMedia, ItemTitle } from "./ui/item";
import Link from "next/link";
import { DrawerClose } from "./ui/drawer";

export function SidebarDrawerAuth() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data, isPending } = useSession();

  if (isPending) return null;

  const isLoggedIn = !!data?.session;

  return (
    <>
      {!isLoggedIn ? (
        <DrawerClose asChild>
          <Item variant="default" size="sm" className="cursor-pointer" asChild>
            <Link href="/login">
              <ItemMedia>
                <LogInIcon className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Log in</ItemTitle>
              </ItemContent>
            </Link>
          </Item>
        </DrawerClose>
      ) : (
        <DrawerClose asChild>
          <Item
            variant="muted"
            size="sm"
            className="cursor-pointer bg-red-50"
            onClick={async () => {
              if (isSubmitting) return;

              setIsSubmitting(true);
              await signOut();
              router.refresh();
              setIsSubmitting(false);
            }}
          >
            <ItemMedia>
              <LogOutIcon className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Sign out</ItemTitle>
            </ItemContent>
          </Item>
        </DrawerClose>
      )}
    </>
  );
}
