import z from "zod";
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

    return { sharedMeals, privateMeals, unpublishedRecipes, household };
  }),
});
