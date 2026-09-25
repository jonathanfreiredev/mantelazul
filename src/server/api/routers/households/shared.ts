import type { Prisma } from "generated/prisma/client";

type Db = Prisma.TransactionClient;

/** The household the user belongs to, or null when they belong to none. */
export async function getHouseholdId(
  db: Db,
  userId: string,
): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { householdId: true },
  });

  return user?.householdId ?? null;
}
