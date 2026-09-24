"use client";

import { GlobeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { LOCALE_NAMES, useLocaleSwitch } from "~/hooks/use-locale-switch";
import { LOCALES, type Locale } from "~/lib/locales";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/**
 * Header language picker. It is an icon button to match the other header controls (assistant,
 * avatar, burger); the active language is marked inside the menu.
 */
export function LocaleSwitcher() {
  const t = useTranslations("Header");
  const { locale, switchTo } = useLocaleSwitch();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-lg" aria-label={t("language")}>
          <GlobeIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(next) => switchTo(next as Locale)}
        >
          {LOCALES.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {LOCALE_NAMES[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
