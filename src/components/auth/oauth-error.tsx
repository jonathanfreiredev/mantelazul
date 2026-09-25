"use client";

import { useTranslations } from "next-intl";

interface OAuthErrorProps {
  /** Error code the provider callback sent back in the `?error=` query parameter. */
  code?: string;
}

/** Message shown when an OAuth sign-in comes back with an error instead of a session. */
export function OAuthError({ code }: OAuthErrorProps) {
  const t = useTranslations("AuthSocial");

  if (!code) return null;

  return (
    <p className="text-destructive text-sm" role="alert">
      {code === "account_not_linked" ? t("accountExists") : t("errorGeneric")}
    </p>
  );
}
