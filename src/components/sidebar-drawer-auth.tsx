"use client";
import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "~/server/better-auth/client";
import { Item, ItemContent, ItemMedia, ItemTitle } from "./ui/item";
import { useRouter } from "~/i18n/navigation";
import { DrawerClose } from "./ui/drawer";

interface SidebarDrawerAuthProps {
  /**
   * Comes from the server, so the item is there as soon as the drawer opens. Asking the client
   * session here made the whole block disappear while the request was in flight, which read as
   * "there is no way to log in".
   */
  isLoggedIn: boolean;
}

export function SidebarDrawerAuth({ isLoggedIn }: SidebarDrawerAuthProps) {
  const t = useTranslations("Menu");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!isLoggedIn) return null;

  return (
    <DrawerClose asChild>
      <Item
        variant="muted"
        size="sm"
        className="text-destructive bg-destructive/10 cursor-pointer"
        onClick={async () => {
          if (isSubmitting) return;

          setIsSubmitting(true);
          await authClient.signOut();
          router.refresh();
          setIsSubmitting(false);
        }}
      >
        <ItemMedia>
          <LogOutIcon className="size-5" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t("signOut")}</ItemTitle>
        </ItemContent>
      </Item>
    </DrawerClose>
  );
}
