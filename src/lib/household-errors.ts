/**
 * Error codes shared by the household router and its UI. They travel as the `message` of a
 * `TRPCError`, so the client can tell the known cases apart and show a specific message instead of
 * a generic one.
 */
export const HOUSEHOLD_ERRORS = {
  noHousehold: "no-household",
  alreadyInHousehold: "already-in-household",
  alreadyMember: "already-member",
  inviteInvalid: "invite-invalid",
  inviteExpired: "invite-expired",
  inviteEmailMismatch: "invite-email-mismatch",
  inviteEmailFailed: "invite-email-failed",
} as const;
