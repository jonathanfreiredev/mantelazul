import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "generated/prisma/client";
import z from "zod";
import { HOUSEHOLD_ERRORS } from "~/lib/household-errors";
import { sendHouseholdInviteEmail } from "~/server/resend";
import type {
  HouseholdDto,
  HouseholdInvitePreviewDto,
} from "~/types/household";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { getHouseholdId } from "./shared";
import { householdInviteSchema, householdNameSchema } from "./validation";

/** How long an invitation stays valid. */
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

type Db = Prisma.TransactionClient;

async function requireHouseholdId(db: Db, userId: string): Promise<string> {
  const householdId = await getHouseholdId(db, userId);

  if (!householdId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: HOUSEHOLD_ERRORS.noHousehold,
    });
  }

  return householdId;
}

async function loadHousehold(
  db: Db,
  householdId: string,
): Promise<HouseholdDto> {
  const household = await db.household.findUnique({
    where: { id: householdId },
    include: {
      members: {
        select: { id: true, name: true, email: true, image: true },
        orderBy: { name: "asc" },
      },
      invites: {
        where: { status: "PENDING" },
        include: { invitedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!household) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  const { invites, ...rest } = household;

  return {
    ...rest,
    invites: invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      invitedByName: invite.invitedBy.name,
    })),
  };
}

/**
 * Detaches a user from their household. The meals keep pointing at the household, so the members
 * who stay keep seeing them; the leaver simply stops seeing them. When the last member leaves the
 * household and its meals are removed by the cascade.
 */
async function leaveHousehold(
  db: Db,
  userId: string,
  householdId: string,
): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { householdId: null } });

  const remaining = await db.user.findMany({
    where: { householdId },
    select: { id: true },
  });

  if (remaining.length === 0) {
    await db.household.delete({ where: { id: householdId } });
    return;
  }

  // The household lives on: if the leaver owned it, hand ownership to another member.
  const household = await db.household.findUnique({
    where: { id: householdId },
    select: { ownerId: true },
  });

  if (household?.ownerId === userId) {
    await db.household.update({
      where: { id: householdId },
      data: { ownerId: remaining[0]!.id },
    });
  }
}

/** Absolute origin of the request, used to build the invitation link. */
function getBaseUrl(headers: Headers): string {
  const host =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";

  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol =
    headers.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");

  return `${protocol}://${host}`;
}

export const householdsRouter = createTRPCRouter({
  /** The household the signed-in user belongs to, or null when they belong to none. */
  getMine: protectedProcedure.query(
    async ({ ctx }): Promise<HouseholdDto | null> => {
      const householdId = await getHouseholdId(ctx.db, ctx.session.user.id);

      if (!householdId) return null;

      return loadHousehold(ctx.db, householdId);
    },
  ),

  create: protectedProcedure
    .input(householdNameSchema)
    .mutation(async ({ ctx, input }): Promise<HouseholdDto> => {
      const userId = ctx.session.user.id;
      const currentHouseholdId = await getHouseholdId(ctx.db, userId);

      if (currentHouseholdId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: HOUSEHOLD_ERRORS.alreadyInHousehold,
        });
      }

      const household = await ctx.db.household.create({
        data: {
          name: input.name,
          ownerId: userId,
          members: { connect: { id: userId } },
        },
      });

      return loadHousehold(ctx.db, household.id);
    }),

  rename: protectedProcedure
    .input(householdNameSchema)
    .mutation(async ({ ctx, input }) => {
      const householdId = await requireHouseholdId(ctx.db, ctx.session.user.id);

      await ctx.db.household.update({
        where: { id: householdId },
        data: { name: input.name },
      });

      return { success: true };
    }),

  leave: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const householdId = await getHouseholdId(ctx.db, userId);

    if (!householdId) return { success: true };

    await ctx.db.$transaction((tx) => leaveHousehold(tx, userId, householdId));

    return { success: true };
  }),

  invite: protectedProcedure
    .input(householdInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const householdId = await requireHouseholdId(ctx.db, userId);
      const email = input.email.toLowerCase();

      const [household, inviter] = await Promise.all([
        ctx.db.household.findUnique({
          where: { id: householdId },
          select: { name: true },
        }),
        ctx.db.user.findUnique({
          where: { id: userId },
          select: { name: true },
        }),
      ]);

      if (!household || !inviter) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const alreadyMember = await ctx.db.user.findFirst({
        where: { householdId, email },
        select: { id: true },
      });

      if (alreadyMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: HOUSEHOLD_ERRORS.alreadyMember,
        });
      }

      // A fresh token replaces any previous pending invitation for the same address.
      await ctx.db.householdInvite.updateMany({
        where: { householdId, email, status: "PENDING" },
        data: { status: "REVOKED" },
      });

      const invite = await ctx.db.householdInvite.create({
        data: {
          email,
          token: createId(),
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          householdId,
          invitedById: userId,
        },
      });

      try {
        await sendHouseholdInviteEmail({
          to: email,
          householdName: household.name,
          inviterName: inviter.name,
          url: `${getBaseUrl(ctx.headers)}/${input.locale}/household/invite/${invite.token}`,
          locale: input.locale,
        });
      } catch {
        // An invitation nobody receives is worthless, so it is not left behind.
        await ctx.db.householdInvite.delete({ where: { id: invite.id } });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: HOUSEHOLD_ERRORS.inviteEmailFailed,
        });
      }

      return { success: true };
    }),

  revokeInvite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const householdId = await requireHouseholdId(ctx.db, ctx.session.user.id);

      const result = await ctx.db.householdInvite.updateMany({
        where: { id: input.id, householdId, status: "PENDING" },
        data: { status: "REVOKED" },
      });

      if (result.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { success: true };
    }),

  getInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }): Promise<HouseholdInvitePreviewDto> => {
      const invite = await ctx.db.householdInvite.findUnique({
        where: { token: input.token },
        include: {
          household: { select: { id: true, name: true } },
          invitedBy: { select: { name: true } },
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: HOUSEHOLD_ERRORS.inviteInvalid,
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { email: true, householdId: true },
      });

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return {
        householdId: invite.household.id,
        householdName: invite.household.name,
        email: invite.email,
        invitedByName: invite.invitedBy.name,
        expiresAt: invite.expiresAt,
        status: invite.status,
        matchesCurrentUser:
          user.email.toLowerCase() === invite.email.toLowerCase(),
        isInAnotherHousehold:
          !!user.householdId && user.householdId !== invite.householdId,
      };
    }),

  /**
   * Joins the household the invitation points at. When the user already belongs to another
   * household they must confirm first (`leaveCurrent`), because leaving can delete that household
   * along with its shared meals.
   */
  acceptInvite: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        leaveCurrent: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const invite = await ctx.db.householdInvite.findUnique({
        where: { token: input.token },
      });

      if (!invite || invite.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: HOUSEHOLD_ERRORS.inviteInvalid,
        });
      }

      if (invite.expiresAt.getTime() < Date.now()) {
        await ctx.db.householdInvite.update({
          where: { id: invite.id },
          data: { status: "EXPIRED" },
        });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: HOUSEHOLD_ERRORS.inviteExpired,
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { email: true, householdId: true },
      });

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: HOUSEHOLD_ERRORS.inviteEmailMismatch,
        });
      }

      if (user.householdId === invite.householdId) {
        await ctx.db.householdInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED" },
        });

        return { success: true };
      }

      if (user.householdId && !input.leaveCurrent) {
        throw new TRPCError({
          code: "CONFLICT",
          message: HOUSEHOLD_ERRORS.alreadyInHousehold,
        });
      }

      await ctx.db.$transaction(async (tx) => {
        if (user.householdId) {
          await leaveHousehold(tx, userId, user.householdId);
        }

        await tx.user.update({
          where: { id: userId },
          data: { householdId: invite.householdId },
        });

        await tx.householdInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED" },
        });
      });

      return { success: true };
    }),
});
