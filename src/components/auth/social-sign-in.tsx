"use client";

import { Separator } from "../ui/separator";
import { usePathname } from "~/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/server/better-auth/client";
import { Button } from "../ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.28v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27a7.21 7.21 0 0 1 0-4.54V6.64H1.28a11.99 11.99 0 0 0 0 10.72l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.64l4 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

interface SocialSignInProps {
  /** Where to land after the provider redirects back, e.g. an invitation page. */
  redirectTo?: string;
  /** Whether the provider is configured; the button is hidden when it is not. */
  enabled?: boolean;
}

/**
 * Google sign-in and the divider that separates it from the email form. The OAuth flow leaves the
 * app and comes back, so the locale and the `next` destination are baked into the callback URLs
 * instead of being applied by the router afterwards.
 */
export function SocialSignIn({ redirectTo, enabled }: SocialSignInProps) {
  const t = useTranslations("AuthSocial");
  const locale = useLocale();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!enabled) return null;

  async function handleGoogle() {
    setIsRedirecting(true);

    const origin = window.location.origin;
    const destination = `${origin}/${locale}${redirectTo ?? ""}`;

    await authClient.signIn.social({
      provider: "google",
      callbackURL: destination,
      newUserCallbackURL: destination,
      errorCallbackURL: `${origin}/${locale}${pathname}`,
      fetchOptions: {
        onError(error) {
          setIsRedirecting(false);
          toast.error(t("errorTitle"), {
            description: error.error.message,
            position: "bottom-right",
          });
        },
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        disabled={isRedirecting}
      >
        <GoogleIcon />
        {t("google")}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">{t("separator")}</span>
        <Separator className="flex-1" />
      </div>
    </div>
  );
}
