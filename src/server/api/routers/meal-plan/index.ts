import { TRPCError } from "@trpc/server";
import type { Prisma } from "generated/prisma/client";
import z from "zod";
import {
  addDays,
  DAYS_IN_WEEK,
  startOfWeek,
  toDbDate,
  toIsoDate,
} from "~/lib/dates";
import { toLocale } from "~/lib/locales";
import { pickTranslation } from "~/server/translations/resolve";
import type { MealPlanWeekDto } from "~/types/meal-plan";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { getHouseholdId } from "../households/shared";
import {
  mealPlanEntryCreateSchema,
  mealPlanEntryUpdateSchema,
  mealPlanWeekSchema,
} from "./validation";

type Db = Prisma.TransactionClient;

/**
 * The meals a user is allowed to see: the shared meals of their household, plus their own private
 * ones (a private meal is one with no household). With no household, only the second branch
 * applies.
 */
function visibilityFilter(
  userId: string,
  householdId: string | null,
): Prisma.MealPlanEntryWhereInput {
  const or: Prisma.MealPlanEntryWhereInput[] = [
    { householdId: null, createdById: userId },
  ];

  if (householdId) {
    or.push({ householdId });
  }

  return { OR: or };
}

/** Loads an entry only if the user can see it, otherwise fails as not found. */
async function requireVisibleEntry(
  db: Db,
  userId: string,
  entryId: string,
): Promise<{ id: string; createdById: string; householdId: string | null }> {
  const entry = await db.mealPlanEntry.findUnique({
    where: { id: entryId },
    select: { id: true, createdById: true, householdId: true },
  });

  if (!entry) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  const householdId = await getHouseholdId(db, userId);
  const isSharedWithMe =
    entry.householdId !== null && entry.householdId === householdId;
  const isMyPrivateMeal =
    entry.householdId === null && entry.createdById === userId;

  if (!isSharedWithMe && !isMyPrivateMeal) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return entry;
}

export const mealPlanRouter = createTRPCRouter({
  /** A Monday-to-Sunday slice of the calendar. */
  getWeek: protectedProcedure
    .input(mealPlanWeekSchema)
    .query(async ({ ctx, input }): Promise<MealPlanWeekDto> => {
      const userId = ctx.session.user.id;
      const householdId = await getHouseholdId(ctx.db, userId);
      const locale = toLocale(input.locale);

      const startDate = startOfWeek(input.date);
      const endDate = addDays(startDate, DAYS_IN_WEEK - 1);

      const entries = await ctx.db.mealPlanEntry.findMany({
        where: {
          date: { gte: toDbDate(startDate), lte: toDbDate(endDate) },
          ...visibilityFilter(userId, householdId),
        },
        include: {
          recipe: {
            select: {
              id: true,
              slug: true,
              imageUrl: true,
              defaultServings: true,
              sourceLocale: true,
              translations: { select: { locale: true, title: true } },
            },
          },
          createdBy: { select: { name: true } },
        },
        orderBy: [{ date: "asc" }, { order: "asc" }, { createdAt: "asc" }],
      });

      return {
        startDate,
        entries: entries.map((entry) => {
          const translation = pickTranslation(
            entry.recipe.translations,
            locale,
            entry.recipe.sourceLocale,
          );

          return {
            id: entry.id,
            date: toIsoDate(entry.date),
            order: entry.order,
            servings: entry.servings,
            note: entry.note,
            isPrivate: entry.householdId === null,
            isMine: entry.createdById === userId,
            createdByName: entry.createdBy.name,
            recipe: {
              id: entry.recipe.id,
              slug: entry.recipe.slug,
              title: translation?.title ?? "",
              imageUrl: entry.recipe.imageUrl,
              defaultServings: entry.recipe.defaultServings,
            },
          };
        }),
      };
    }),

  add: protectedProcedure
    .input(mealPlanEntryCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const householdId = input.shared
        ? await getHouseholdId(ctx.db, userId)
        : null;

      const date = toDbDate(input.date);
      const lastEntry = await ctx.db.mealPlanEntry.findFirst({
        where: { date },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const entry = await ctx.db.mealPlanEntry.create({
        data: {
          date,
          order: (lastEntry?.order ?? -1) + 1,
          servings: input.servings ?? null,
          note: input.note?.trim() || null,
          householdId,
          recipeId: input.recipeId,
          createdById: userId,
        },
      });

      return { id: entry.id };
    }),

  update: protectedProcedure
    .input(mealPlanEntryUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const entry = await requireVisibleEntry(ctx.db, userId, input.id);

      // Moving a meal between private and shared is the creator's call: any other member making a
      // shared meal private would be hiding it from the rest of the household.
      let householdId: string | null | undefined;
      if (input.shared !== undefined) {
        if (entry.createdById !== userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "not-creator" });
        }

        if (input.shared) {
          const currentHouseholdId = await getHouseholdId(ctx.db, userId);

          if (!currentHouseholdId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "no-household",
            });
          }

          householdId = currentHouseholdId;
        } else {
          householdId = null;
        }
      }

      await ctx.db.mealPlanEntry.update({
        where: { id: input.id },
        data: {
          ...(input.date !== undefined ? { date: toDbDate(input.date) } : {}),
          ...(input.servings !== undefined ? { servings: input.servings } : {}),
          ...(input.note !== undefined
            ? { note: input.note?.trim() || null }
            : {}),
          ...(householdId !== undefined ? { householdId } : {}),
        },
      });

      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireVisibleEntry(ctx.db, ctx.session.user.id, input.id);

      await ctx.db.mealPlanEntry.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
