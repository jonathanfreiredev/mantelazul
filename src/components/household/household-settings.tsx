"use client";

import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Spinner } from "../ui/spinner";
import { HouseholdCreateForm } from "./household-create-form";
import { HouseholdInviteForm } from "./household-invite-form";
import { HouseholdLeaveDialog } from "./household-leave-dialog";
import { HouseholdMembersList } from "./household-members-list";
import { HouseholdNameForm } from "./household-name-form";
import { HouseholdPendingInvites } from "./household-pending-invites";

interface HouseholdSettingsProps {
  currentUserId: string;
}

export function HouseholdSettings({ currentUserId }: HouseholdSettingsProps) {
  const t = useTranslations("Household");
  const householdQuery = api.households.getMine.useQuery();

  if (householdQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (householdQuery.isError) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t("loadError")}
      </p>
    );
  }

  const household = householdQuery.data;

  if (!household) {
    return <HouseholdCreateForm />;
  }

  return (
    <div className="flex flex-col gap-6">
      <HouseholdNameForm name={household.name} />

      <HouseholdMembersList
        members={household.members}
        ownerId={household.ownerId}
        currentUserId={currentUserId}
      />

      <HouseholdInviteForm />

      <HouseholdPendingInvites invites={household.invites} />

      <HouseholdLeaveDialog />
    </div>
  );
}
