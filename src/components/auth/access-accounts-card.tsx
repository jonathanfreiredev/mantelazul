"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { AddPasswordForm } from "./add-password-form";
import { ChangePasswordForm } from "./change-password-form";

interface AccessAccountsCardProps {
  /** Whether Google sign-in is configured; the row is hidden when it is not. */
  googleEnabled: boolean;
  /** The account's address, used to explain why a Google account was rejected. */
  email: string;
  /** Error code the provider callback sent back in the `?error=` query parameter. */
  authError?: string;
}

interface UnlinkTarget {
  id: string;
  label: string;
}

/**
 * The ways into the account. A user signs in with any of the linked methods and can link the
 * others from here. Removing the last one is blocked everywhere: without it they could not come
 * back.
 */
export function AccessAccountsCard({
  googleEnabled,
  email,
  authError,
}: AccessAccountsCardProps) {
  const t = useTranslations("AccessAccounts");
  const locale = useLocale();
  const utils = api.useUtils();
  const { data, isLoading } = api.users.getLinkedAccounts.useQuery();

  const [isAddingPassword, setIsAddingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<UnlinkTarget | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const accounts = data?.accounts ?? [];
  const hasPassword = data?.hasPassword ?? false;
  const passwordAccount = accounts.find(
    (account) => account.providerId === "credential",
  );
  const googleAccount = accounts.find(
    (account) => account.providerId === "google",
  );
  const isLastMethod = accounts.length <= 1;

  function describeLinkError(code: string): string {
    switch (code) {
      case "email_does_not_match":
        return t("emailDoesNotMatch", { email });
      case "account_already_linked_to_different_user":
        return t("alreadyLinkedElsewhere");
      case "unable_to_link_account":
        return t("linkFailed");
      default:
        return t("linkErrorGeneric");
    }
  }

  function handleConnectGoogle() {
    void authClient.linkSocial({
      provider: "google",
      callbackURL: `${window.location.origin}/${locale}/profile`,
      // Without this, a rejected connection drops the user on Better Auth's raw error page.
      errorCallbackURL: `${window.location.origin}/${locale}/profile`,
      fetchOptions: {
        onError(error) {
          toast.error(t("connectError"), {
            description: error.error.message,
            position: "bottom-right",
          });
        },
      },
    });
  }

  async function handleUnlink() {
    if (!unlinkTarget) return;

    setIsUnlinking(true);

    await authClient.unlinkAccount({
      accountId: unlinkTarget.id,
      fetchOptions: {
        async onSuccess() {
          setIsUnlinking(false);
          setUnlinkTarget(null);
          await utils.users.getLinkedAccounts.invalidate();
          toast.success(t("unlinked"));
        },
        onError(error) {
          setIsUnlinking(false);
          toast.error(t("unlinkError"), {
            description:
              error.error.code === "SESSION_NOT_FRESH"
                ? t("sessionNotFresh")
                : error.error.message,
            position: "bottom-right",
          });
        },
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {authError && (
          <div
            className="border-destructive/40 bg-destructive/5 flex flex-col gap-1 rounded-md border p-3"
            role="alert"
          >
            <span className="text-sm font-medium">{t("linkErrorTitle")}</span>
            <span className="text-muted-foreground text-sm">
              {describeLinkError(authError)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("password")}</span>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="text-muted-foreground text-sm">
                {hasPassword ? t("connected") : t("notConnected")}
              </span>
            )}
          </div>

          {!isLoading && (
            <div className="flex items-center gap-2">
              {hasPassword ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    {t("changePassword")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={isLastMethod || !passwordAccount}
                    onClick={() =>
                      passwordAccount &&
                      setUnlinkTarget({
                        id: passwordAccount.id,
                        label: t("passwordShort"),
                      })
                    }
                  >
                    {t("remove")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingPassword(true)}
                >
                  {t("addPassword")}
                </Button>
              )}
            </div>
          )}
        </div>

        {googleEnabled && (
          <>
            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t("google")}</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {googleAccount ? t("connected") : t("notConnected")}
                  </span>
                )}
              </div>

              {!isLoading && (
                <div className="flex items-center gap-2">
                  {googleAccount ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isLastMethod}
                      onClick={() =>
                        setUnlinkTarget({
                          id: googleAccount.id,
                          label: t("google"),
                        })
                      }
                    >
                      {t("disconnect")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectGoogle}
                    >
                      {t("connect")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {!isLoading && isLastMethod && (
          <p className="text-muted-foreground text-xs">{t("lastMethodHint")}</p>
        )}
      </CardContent>

      <Dialog open={isAddingPassword} onOpenChange={setIsAddingPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addPassword")}</DialogTitle>
            <DialogDescription>{t("addPasswordDescription")}</DialogDescription>
          </DialogHeader>

          <AddPasswordForm onAdded={() => setIsAddingPassword(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("changePassword")}</DialogTitle>
            <DialogDescription>{t("changePasswordDescription")}</DialogDescription>
          </DialogHeader>

          <ChangePasswordForm />
        </DialogContent>
      </Dialog>

      <Dialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("unlinkTitle", { method: unlinkTarget?.label ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("unlinkDescription")}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setUnlinkTarget(null)}
              disabled={isUnlinking}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={isUnlinking}
            >
              {t("unlinkConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
