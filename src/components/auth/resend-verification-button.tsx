"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { verificationCallbackUrl } from "~/lib/email-verification";
import { authClient } from "~/server/better-auth/client";
import { Button } from "../ui/button";

interface ResendVerificationButtonProps {
  email: string;
  /** Where the verification link should land afterwards, e.g. an invitation page. */
  redirectTo?: string;
}

/** Requests a fresh verification link, wherever the user is told their address is unverified. */
export function ResendVerificationButton({
  email,
  redirectTo,
}: ResendVerificationButtonProps) {
  const t = useTranslations("EmailVerification");
  const locale = useLocale();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setIsSending(true);

    await authClient.sendVerificationEmail({
      email,
      callbackURL: verificationCallbackUrl(
        window.location.origin,
        locale,
        redirectTo,
      ),
      fetchOptions: {
        onSuccess() {
          setIsSending(false);
          setSent(true);
        },
        onError(error) {
          setIsSending(false);
          toast.error(t("resendError"), {
            description: error.error.message,
            position: "bottom-right",
          });
        },
      },
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleResend}
      disabled={isSending || sent}
    >
      {sent ? t("resent") : t("resend")}
    </Button>
  );
}
