import z from "zod";
import { auth } from "~/server/better-auth";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

export const usersRouter = createTRPCRouter({
  getAuthor: publicProcedure
    .input(
      z.object({
        authorId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const author = await ctx.db.user.findUnique({
        where: { id: input.authorId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!author) {
        throw new Error("Author not found");
      }

      return author;
    }),

  /**
   * What deleting the account takes with it, so the confirmation dialog can spell it out before
   * the user commits. Meals go even when they are shared, which is why the count matters: other
   * household members may be relying on them.
   */
  getDeletionImpact: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [sharedMeals, privateMeals, unpublishedRecipes, current] =
      await Promise.all([
        ctx.db.mealPlanEntry.count({
          where: { createdById: userId, householdId: { not: null } },
        }),
        ctx.db.mealPlanEntry.count({
          where: { createdById: userId, householdId: null },
        }),
        ctx.db.recipe.count({ where: { authorId: userId, published: false } }),
        ctx.db.user.findUnique({
          where: { id: userId },
          select: { householdId: true },
        }),
      ]);

    // A Google-only account has no password to confirm the deletion with, so the dialog has to
    // know whether to ask for one.
    const credentialCount = await ctx.db.account.count({
      where: { userId, providerId: "credential", password: { not: null } },
    });

    let household: { name: string; memberCount: number } | null = null;

    if (current?.householdId) {
      const row = await ctx.db.household.findUnique({
        where: { id: current.householdId },
        select: { name: true, _count: { select: { members: true } } },
      });

      if (row) {
        household = { name: row.name, memberCount: row._count.members };
      }
    }

    return {
      sharedMeals,
      privateMeals,
      unpublishedRecipes,
      household,
      hasPassword: credentialCount > 0,
    };
  }),

  /** The sign-in methods linked to the account, for the "access accounts" card. */
  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.db.account.findMany({
      where: { userId: ctx.session.user.id },
      select: { id: true, providerId: true },
      orderBy: { createdAt: "asc" },
    });

    return {
      accounts,
      hasPassword: accounts.some((account) => account.providerId === "credential"),
    };
  }),

  /**
   * Gives a password to an account that has none (one created with Google). Better Auth keeps
   * `setPassword` off the HTTP surface, so the client reaches it through here.
   */
  setPassword: protectedProcedure
    .input(z.object({ newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      await auth.api.setPassword({
        body: { newPassword: input.newPassword },
        headers: ctx.headers,
      });

      return { success: true };
    }),
});
