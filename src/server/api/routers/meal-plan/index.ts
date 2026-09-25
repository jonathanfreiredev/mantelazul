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
import { toLocale, type Locale } from "~/lib/locales";
import { MEAL_PLAN_ERRORS } from "~/lib/meal-plan-errors";
import { pickTranslation } from "~/server/translations/resolve";
import type {
  MealPlanEntriesDto,
  MealPlanEntryDto,
  MealPlanWeekDto,
} from "~/types/meal-plan";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { getHouseholdId } from "../households/shared";
import {
  mealPlanEntryBatchCreateSchema,
  mealPlanEntryCreateSchema,
  mealPlanEntryUpdateSchema,
  mealPlanRangeSchema,
  mealPlanReorderSchema,
  mealPlanWeekSchema,
} from "./validation";

type Db = Prisma.TransactionClient;

/** Everything a calendar entry needs to be rendered, in the viewer's language. */
const ENTRY_INCLUDE = {
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
} satisfies Prisma.MealPlanEntryInclude;

type EntryWithRecipe = Prisma.MealPlanEntryGetPayload<{
  include: typeof ENTRY_INCLUDE;
}>;

/** The meals a user is allowed to see: the shared meals of their household, plus their own private
 * ones (a private meal is one with no household). With no household, only the second branch
 * applies. */
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

function toEntryDto(
  entry: EntryWithRecipe,
  userId: string,
  locale: Locale,
): MealPlanEntryDto {
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
}

/** The visible meals of an inclusive date range, in the viewer's language. */
async function loadEntries(
  db: Db,
  userId: string,
  from: string,
  to: string,
  locale: Locale,
): Promise<MealPlanEntryDto[]> {
  const householdId = await getHouseholdId(db, userId);

  const entries = await db.mealPlanEntry.findMany({
    where: {
      date: { gte: toDbDate(from), lte: toDbDate(to) },
      ...visibilityFilter(userId, householdId),
    },
    include: ENTRY_INCLUDE,
    orderBy: [{ date: "asc" }, { order: "asc" }, { createdAt: "asc" }],
  });

  return entries.map((entry) => toEntryDto(entry, userId, locale));
}

interface MealInput {
  date: string;
  recipeId: string;
  servings?: number;
  note?: string;
  shared: boolean;
}

/**
 * Inserts a batch of meals. `order` is a position within a day, so the next free one is computed
 * once per distinct date instead of once per meal.
 */
async function insertEntries(
  db: Db,
  userId: string,
  householdId: string | null,
  meals: MealInput[],
): Promise<string[]> {
  const dates = [...new Set(meals.map((meal) => meal.date))];

  const lastOrders = await db.mealPlanEntry.groupBy({
    by: ["date"],
    where: { date: { in: dates.map(toDbDate) } },
    _max: { order: true },
  });

  const nextOrderByDate = new Map(
    lastOrders.map((row) => [toIsoDate(row.date), (row._max.order ?? -1) + 1]),
  );

  const ids: string[] = [];

  for (const meal of meals) {
    const order = nextOrderByDate.get(meal.date) ?? 0;
    nextOrderByDate.set(meal.date, order + 1);

    const entry = await db.mealPlanEntry.create({
      data: {
        date: toDbDate(meal.date),
        order,
        servings: meal.servings ?? null,
        note: meal.note?.trim() || null,
        householdId: meal.shared ? householdId : null,
        recipeId: meal.recipeId,
        createdById: userId,
      },
      select: { id: true },
    });

    ids.push(entry.id);
  }

  return ids;
}

export const mealPlanRouter = createTRPCRouter({
  /** A Monday-to-Sunday slice of the calendar. */
  getWeek: protectedProcedure
    .input(mealPlanWeekSchema)
    .query(async ({ ctx, input }): Promise<MealPlanWeekDto> => {
      const startDate = startOfWeek(input.date);
      const endDate = addDays(startDate, DAYS_IN_WEEK - 1);

      return {
        startDate,
        entries: await loadEntries(
          ctx.db,
          ctx.session.user.id,
          startDate,
          endDate,
          toLocale(input.locale),
        ),
      };
    }),

  /** Any slice of the calendar, up to a month long. Used by the assistant to read the plan. */
  getRange: protectedProcedure
    .input(mealPlanRangeSchema)
    .query(async ({ ctx, input }): Promise<MealPlanEntriesDto> => {
      return {
        entries: await loadEntries(
          ctx.db,
          ctx.session.user.id,
          input.from,
          input.to,
          toLocale(input.locale),
        ),
      };
    }),

  add: protectedProcedure
    .input(mealPlanEntryCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const householdId = await getHouseholdId(ctx.db, userId);

      const [id] = await insertEntries(ctx.db, userId, householdId, [input]);

      return { id };
    }),

  /**
   * Plans several meals at once, in a single transaction. Used by the assistant, which composes a
   * whole plan and writes it in one call. It only accepts recipes that already exist and are
   * visible to the caller, and creates nothing when any of them is not.
   */
  addMany: protectedProcedure
    .input(mealPlanEntryBatchCreateSchema)
    .mutation(async ({ ctx, input }): Promise<MealPlanEntriesDto> => {
      const userId = ctx.session.user.id;
      const locale = toLocale(input.locale);
      const householdId = await getHouseholdId(ctx.db, userId);

      const recipeIds = [...new Set(input.meals.map((meal) => meal.recipeId))];
      const visibleRecipes = await ctx.db.recipe.findMany({
        where: {
          id: { in: recipeIds },
          OR: [{ published: true }, { authorId: userId }],
        },
        select: { id: true },
      });
      const visibleIds = new Set(visibleRecipes.map((recipe) => recipe.id));
      const invalidRecipeIds = recipeIds.filter((id) => !visibleIds.has(id));

      if (invalidRecipeIds.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: MEAL_PLAN_ERRORS.recipesNotVisible,
          cause: { invalidRecipeIds },
        });
      }

      const ids = await ctx.db.$transaction((tx) =>
        insertEntries(tx, userId, householdId, input.meals),
      );

      const entries = await ctx.db.mealPlanEntry.findMany({
        where: { id: { in: ids } },
        include: ENTRY_INCLUDE,
        orderBy: [{ date: "asc" }, { order: "asc" }, { createdAt: "asc" }],
      });

      return {
        entries: entries.map((entry) => toEntryDto(entry, userId, locale)),
      };
    }),

  /**
   * Saves a new arrangement of the calendar: the client sends the days a drag touched, each with
   * its meals in their final order. Only meals the caller can see can be moved, and `order` is
   * simply the position in the list.
   */
  reorder: protectedProcedure
    .input(mealPlanReorderSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const householdId = await getHouseholdId(ctx.db, userId);

      const positions = input.days.flatMap((day) =>
        day.entryIds.map((id, order) => ({ id, date: day.date, order })),
      );
      const entryIds = positions.map((position) => position.id);

      const visibleEntries = await ctx.db.mealPlanEntry.findMany({
        where: {
          id: { in: entryIds },
          ...visibilityFilter(userId, householdId),
        },
        select: { id: true },
      });
      const visibleIds = new Set(visibleEntries.map((entry) => entry.id));
      const invalidEntryIds = [...new Set(entryIds)].filter(
        (id) => !visibleIds.has(id),
      );

      if (invalidEntryIds.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: MEAL_PLAN_ERRORS.entriesNotVisible,
          cause: { invalidEntryIds },
        });
      }

      await ctx.db.$transaction(
        positions.map((position) =>
          ctx.db.mealPlanEntry.update({
            where: { id: position.id },
            data: { date: toDbDate(position.date), order: position.order },
          }),
        ),
      );

      return { success: true };
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
