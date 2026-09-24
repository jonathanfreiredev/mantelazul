"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";
import type { Locale } from "~/lib/locales";

// Each language is named in its own language, which is what users expect from a switcher.
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
};

/**
 * Shared locale-switching behaviour for the header button and the mobile drawer. It keeps the
 * current pathname and only swaps the locale segment.
 */
export function useLocaleSwitch() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (next: Locale) => {
    if (next === locale) return;

    router.replace(pathname, { locale: next });
  };

  return { locale, switchTo };
}
