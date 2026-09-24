import { getTranslations } from "next-intl/server";
import { ModeToggle } from "./mode-toogle";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t">
      <div className="flex h-full w-full items-center justify-between px-20 py-12 text-sm text-gray-500">
        <p>{t("rights", { year: new Date().getFullYear() })}</p>
        <ModeToggle size="icon-lg" />
      </div>
    </footer>
  );
}
