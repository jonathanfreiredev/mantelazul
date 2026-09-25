"use client";

import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { toLocale } from "~/lib/locales";
import { api } from "~/trpc/react";
import type { HouseholdInviteDto } from "~/types/household";
import { formatLongDate } from "../meal-plan/format";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "../ui/item";

interface HouseholdPendingInvitesProps {
  invites: HouseholdInviteDto[];
}

export function HouseholdPendingInvites({
  invites,
}: HouseholdPendingInvitesProps) {
  const t = useTranslations("Household");
  const locale = toLocale(useLocale());
  const utils = api.useUtils();

  const revokeMutation = api.households.revokeInvite.useMutation();

  if (invites.length === 0) return null;

  async function handleRevoke(id: string) {
    try {
      await revokeMutation.mutateAsync({ id });
      await utils.households.getMine.invalidate();
      toast.success(t("revoked"));
    } catch (error) {
      toast.error(t("revokeError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("invitesTitle")}</CardTitle>
      </CardHeader>

      <CardContent>
        <ItemGroup>
          {invites.map((invite) => (
            <Item key={invite.id} variant="outline">
              <ItemContent>
                <ItemTitle>{invite.email}</ItemTitle>
                <ItemDescription>
                  {t("invitedBy", { name: invite.invitedByName })} ·{" "}
                  {t("expiresOn", {
                    date: formatLongDate(locale, new Date(invite.expiresAt)),
                  })}
                </ItemDescription>
              </ItemContent>

              <ItemActions>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(invite.id)}
                  disabled={revokeMutation.isPending}
                >
                  {t("revoke")}
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
