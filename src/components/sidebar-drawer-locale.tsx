"use client";

import { useTranslations } from "next-intl";
import { LOCALE_NAMES, useLocaleSwitch } from "~/hooks/use-locale-switch";
import { LOCALES } from "~/lib/locales";
import { Button } from "./ui/button";
import { DrawerClose } from "./ui/drawer";

/**
 * Language picker for the mobile drawer. The header hides its switcher on small screens so it
 * does not crowd the burger and the assistant, so the languages live here instead.
 */
export function SidebarDrawerLocale() {
  const t = useTranslations("Header");
  const { locale, switchTo } = useLocaleSwitch();

  return (
    <div className="mt-2 mb-4 flex w-full flex-col gap-2 border-y px-3 py-4">
      <p className="text-muted-foreground text-xs font-medium">
        {t("language")}
      </p>
      <div className="flex gap-2">
        {LOCALES.map((option) => (
          <DrawerClose key={option} asChild>
            <Button
              variant={option === locale ? "default" : "outline"}
              size="sm"
              onClick={() => switchTo(option)}
            >
              {LOCALE_NAMES[option]}
            </Button>
          </DrawerClose>
        ))}
      </div>
    </div>
  );
}
