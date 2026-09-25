"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { HOUSEHOLD_ERRORS } from "~/lib/household-errors";
import { toLocale } from "~/lib/locales";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export function HouseholdInviteForm() {
  const t = useTranslations("Household");
  const locale = toLocale(useLocale());
  const utils = api.useUtils();
  const [email, setEmail] = useState("");

  const inviteMutation = api.households.invite.useMutation();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) return;

    try {
      await inviteMutation.mutateAsync({ email: trimmed, locale });
      await utils.households.getMine.invalidate();
      toast.success(t("inviteSent"), {
        description: t("inviteSentDescription", { email: trimmed }),
      });
      setEmail("");
    } catch (error) {
      const isAlreadyMember =
        error instanceof Error &&
        error.message === HOUSEHOLD_ERRORS.alreadyMember;

      // Any other failure is reported generically: the internal error code is not for the user.
      toast.error(isAlreadyMember ? t("alreadyMember") : t("inviteError"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("inviteTitle")}</CardTitle>
        <CardDescription>{t("inviteDescription")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field>
            <FieldLabel htmlFor="household-invite-email">
              {t("emailLabel")}
            </FieldLabel>
            <Input
              id="household-invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("emailPlaceholder")}
              autoComplete="off"
              required
            />
          </Field>

          <Button type="submit" disabled={inviteMutation.isPending}>
            {t("invite")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
