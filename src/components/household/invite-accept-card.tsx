"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "~/i18n/navigation";
import { HOUSEHOLD_ERRORS } from "~/lib/household-errors";
import { toLocale } from "~/lib/locales";
import { api } from "~/trpc/react";
import { formatLongDate } from "../meal-plan/format";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Spinner } from "../ui/spinner";

interface InviteAcceptCardProps {
  token: string;
}

export function InviteAcceptCard({ token }: InviteAcceptCardProps) {
  const t = useTranslations("Household");
  const locale = toLocale(useLocale());
  const router = useRouter();
  const utils = api.useUtils();
  const [needsLeave, setNeedsLeave] = useState(false);

  const inviteQuery = api.households.getInvite.useQuery({ token });
  const acceptMutation = api.households.acceptInvite.useMutation();

  async function handleAccept(leaveCurrent: boolean) {
    try {
      await acceptMutation.mutateAsync({ token, leaveCurrent });
      await utils.households.getMine.invalidate();
      await utils.mealPlan.getWeek.invalidate();
      toast.success(
        t("accepted", { household: inviteQuery.data?.householdName ?? "" }),
      );
      router.replace("/calendar");
      router.refresh();
    } catch (error) {
      // The server only refuses when the user is in another household and has not confirmed yet.
      if (
        error instanceof Error &&
        error.message === HOUSEHOLD_ERRORS.alreadyInHousehold
      ) {
        setNeedsLeave(true);
        return;
      }

      toast.error(t("acceptError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  if (inviteQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return <Notice title={t("acceptTitle")} description={t("invalidInvite")} />;
  }

  const invite = inviteQuery.data;

  if (invite.status === "EXPIRED") {
    return <Notice title={t("acceptTitle")} description={t("expiredInvite")} />;
  }

  if (invite.status !== "PENDING") {
    return <Notice title={t("acceptTitle")} description={t("usedInvite")} />;
  }

  if (!invite.matchesCurrentUser) {
    return (
      <Notice
        title={t("acceptTitle")}
        description={t("emailMismatch", { email: invite.email })}
      />
    );
  }

  if (invite.isInAnotherHousehold && !needsLeave) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("switchTitle")}</CardTitle>
          <CardDescription>
            {t("switchDescription", { household: invite.householdName })}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            variant="destructive"
            onClick={() => handleAccept(true)}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? <Spinner /> : null}
            {t("switchConfirm")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("acceptTitle")}</CardTitle>
        <CardDescription>
          {t("acceptIntro", {
            inviter: invite.invitedByName,
            household: invite.householdName,
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs">
          {t("expiresOn", {
            date: formatLongDate(locale, new Date(invite.expiresAt)),
          })}
        </p>

        <Button
          onClick={() => handleAccept(needsLeave)}
          disabled={acceptMutation.isPending}
          className="self-start"
        >
          {acceptMutation.isPending ? <Spinner /> : null}
          {t("accept")}
        </Button>
      </CardContent>
    </Card>
  );
}

function Notice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
