import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { ModeToggle } from "./mode-toogle";

export async function Footer() {
  const t = await getTranslations("Footer");
  const tLegal = await getTranslations("Legal");

  return (
    <footer className="border-t">
      <div className="flex h-full w-full flex-col items-center justify-between gap-6 px-6 py-8 text-sm text-gray-500 sm:flex-row sm:gap-4 sm:px-20 sm:py-12">
        <p>{t("rights", { year: new Date().getFullYear() })}</p>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="hover:opacity-80">
              {tLegal("privacyLink")}
            </Link>
            <Link href="/terms" className="hover:opacity-80">
              {tLegal("termsLink")}
            </Link>
          </nav>
          <ModeToggle size="icon-lg" />
        </div>
      </div>
    </footer>
  );
}
