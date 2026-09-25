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
  DialogTrigger,
} from "../ui/dialog";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

/**
 * Destructive card at the bottom of the profile. It spells out what the deletion takes with it
 * before asking for the password, because the meals created by the user go even when they are
 * shared with a household, and that affects other people.
 */
export function DeleteAccountCard() {
  const t = useTranslations("DeleteAccount");
  const locale = useLocale();
  const { data: impact } = api.users.getDeletionImpact.useQuery();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Until the impact query answers, assume a password is needed: it is the only way to delete an
  // account that has one.
  const requiresPassword = impact?.hasPassword ?? true;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) setPassword("");
  }

  async function handleDelete() {
    setIsDeleting(true);

    await authClient.deleteUser({
      ...(requiresPassword ? { password } : {}),
      fetchOptions: {
        async onSuccess() {
          // The server already cleared the session cookie; signing out keeps the client honest and
          // the hard navigation drops every cached query.
          await authClient.signOut().catch(() => undefined);
          window.location.href = `/${locale}`;
        },
        onError(error) {
          setIsDeleting(false);
          toast.error(t("errorTitle"), {
            description:
              error.error.code === "SESSION_EXPIRED"
                ? t("sessionExpired")
                : error.error.message,
            position: "bottom-right",
          });
        },
      },
    });
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="flex justify-end">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="destructive">{t("delete")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("dialogTitle")}</DialogTitle>
              <DialogDescription>{t("dialogDescription")}</DialogDescription>
            </DialogHeader>

            <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
              {impact && impact.sharedMeals > 0 && (
                <>
                  <li>{t("sharedMeals", { count: impact.sharedMeals })}</li>
                  <li>{t("sharedMealsWarning")}</li>
                </>
              )}
              {impact && impact.privateMeals > 0 && (
                <li>{t("privateMeals", { count: impact.privateMeals })}</li>
              )}
              {impact && impact.unpublishedRecipes > 0 && (
                <li>
                  {t("unpublishedRecipes", {
                    count: impact.unpublishedRecipes,
                  })}
                </li>
              )}
              {impact?.household && (
                <li>
                  {impact.household.memberCount > 1
                    ? t("leavesHousehold", { name: impact.household.name })
                    : t("removesHousehold", { name: impact.household.name })}
                </li>
              )}
              <li>{t("publishedRecipes")}</li>
            </ul>

            {requiresPassword ? (
              <Field>
                <FieldLabel htmlFor="delete-account-password">
                  {t("password")}
                </FieldLabel>
                <Input
                  id="delete-account-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isDeleting}
                />
                <FieldDescription>{t("passwordHint")}</FieldDescription>
              </Field>
            ) : (
              <FieldDescription>{t("noPasswordHint")}</FieldDescription>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isDeleting}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={
                  isDeleting || (requiresPassword && password.length === 0)
                }
              >
                {t("confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
