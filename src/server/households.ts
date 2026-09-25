import { db } from "~/server/db";

/**
 * Hands a household owned by `userId` to another member, so deleting that account does not leave
 * the household without an owner. Does nothing when the user owns nothing or when no other member
 * remains (in that case the household is removed right after the deletion).
 */
export async function reassignHouseholdOwnership(
  userId: string,
): Promise<void> {
  const household = await db.household.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!household) return;

  const nextOwner = await db.user.findFirst({
    where: { householdId: household.id, id: { not: userId } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!nextOwner) return;

  await db.household.update({
    where: { id: household.id },
    data: { ownerId: nextOwner.id },
  });
}

/**
 * Removes households left without members after an account deletion. Their meals and invitations
 * go with them (`onDelete: Cascade`), matching the rule that a household disappears with its last
 * member.
 */
export async function deleteMemberlessHouseholds(): Promise<void> {
  await db.household.deleteMany({
    where: { members: { none: {} } },
  });
}
