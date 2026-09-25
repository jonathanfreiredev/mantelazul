"use client";

import { useTranslations } from "next-intl";
import { ResendVerificationButton } from "./resend-verification-button";

interface UnverifiedEmailNoticeProps {
  email: string;
  /** Where the verification link should land afterwards, e.g. an invitation page. */
  redirectTo?: string;
}

/**
 * Shown when a sign-in is refused because the address has not been confirmed yet. It says which
 * mailbox to open and offers a fresh link, since the one that was sent may be long gone.
 */
export function UnverifiedEmailNotice({
  email,
  redirectTo,
}: UnverifiedEmailNoticeProps) {
  const t = useTranslations("EmailVerification");

  return (
    <div
      className="border-border bg-muted/50 flex flex-col items-start gap-3 rounded-md border p-3"
      role="status"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("unverifiedTitle")}</span>
        <span className="text-muted-foreground text-sm">
          {t("unverifiedDescription", { email })}
        </span>
      </div>

      <ResendVerificationButton email={email} redirectTo={redirectTo} />
    </div>
  );
}
