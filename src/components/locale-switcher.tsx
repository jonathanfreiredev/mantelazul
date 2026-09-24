"use client";

import { GlobeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";
import { LOCALES, type Locale } from "~/lib/locales";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Each language is named in its own language, which is what users expect from a switcher.
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Header");

  return (
    <Select
      value={locale}
      onValueChange={(next) =>
        router.replace(pathname, { locale: next as Locale })
      }
    >
      <SelectTrigger aria-label={t("language")} className="w-34">
        <GlobeIcon className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="item-aligned">
        {LOCALES.map((option) => (
          <SelectItem key={option} value={option}>
            {LOCALE_NAMES[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
