import type { Household } from "generated/prisma/client";
import type { InviteStatus } from "generated/prisma/enums";

/** A member of a household, with just the fields the settings page renders. */
export interface HouseholdMemberDto {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

/** An invitation sent to an email, whether or not that email has an account yet. */
export interface HouseholdInviteDto {
  id: string;
  email: string;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  invitedByName: string;
}

export type HouseholdDto = Household & {
  members: HouseholdMemberDto[];
  invites: HouseholdInviteDto[];
};

/** What the invite page shows before the user accepts. */
export interface HouseholdInvitePreviewDto {
  householdId: string;
  householdName: string;
  email: string;
  invitedByName: string;
  expiresAt: Date;
  status: InviteStatus;
  /** Whether the signed-in user is the one the invitation was addressed to. */
  matchesCurrentUser: boolean;
  /** Whether the signed-in user already belongs to another household. */
  isInAnotherHousehold: boolean;
}
