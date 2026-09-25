"use client";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "~/i18n/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { authClient } from "~/server/better-auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface DropdownAvatarMenuProps {
  user: {
    name: string;
  };
}
export const DropdownAvatarMenu = ({ user }: DropdownAvatarMenuProps) => {
  const t = useTranslations("Menu");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer" size="lg">
          {/* <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                  className="grayscale"
                /> */}
          <AvatarFallback className="bg-slate-100">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href="/calendar">{t("calendar")}</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/household">{t("household")}</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile">{t("profile")}</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/recipes">{t("myRecipes")}</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/cookbooks">{t("myCookbooks")}</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            setIsSubmitting(true);
            await authClient.signOut();
            window.location.reload();
            setIsSubmitting(false);
          }}
          disabled={isSubmitting}
        >
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
