"use client";
import { Link, usePathname } from "~/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";

export function SignInOrSignUpButton() {
  const t = useTranslations("AuthButton");
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  return (
    <Button variant="outline" size="lg" asChild>
      <Link href={isLoginPage ? "/signup" : "/login"}>
        {isLoginPage ? t("signUp") : t("signIn")}
      </Link>
    </Button>
  );
}
