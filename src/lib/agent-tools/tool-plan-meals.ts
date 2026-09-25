import { TRPCError } from "@trpc/server";
import { tool } from "ai";
import z from "zod";
import { MEAL_PLAN_ERRORS } from "~/lib/meal-plan-errors";
import {
  isoDateSchema,
  MAX_MEALS_PER_BATCH,
  MAX_NOTE_LENGTH,
  MAX_SERVINGS,
} from "~/server/api/routers/meal-plan/validation";
import { getRequestLocale } from "~/server/translations/request-locale";
import { api } from "~/trpc/server";
import { formatMealPlanForModel } from "./format-recipe-for-model";

/** Reads the ids a rejected batch carried in its `cause`, if any. */
function readInvalidRecipeIds(cause: unknown): string[] {
  if (!cause || typeof cause !== "object" || !("invalidRecipeIds" in cause)) {
    return [];
  }

  const ids = (cause as { invalidRecipeIds: unknown }).invalidRecipeIds;

  return Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string")
    : [];
}

export const toolPlanMeals = tool({
  description: `
Writes a meal plan to the user's calendar in a single call.

The plan is a list of meals. Each one is a recipe on a date, optionally with servings and a note,
and is either shared with the user's household or private to the user.

RULES:
- Only plan recipes that already exist: use the ids returned by 'searchRecipes'. NEVER invent an id, and NEVER create a recipe from here. If nothing suitable exists, say so and offer to create the recipe first, as a separate step.
- Read the calendar first with 'getMealPlan' and tell the user what those days already contain. Meals are added on top of what is already planned; nothing is removed or replaced.
- Ask the user before calling this tool whenever you do not know the date range, the servings, or whether the meals are for the household or private.
- At most ${MAX_MEALS_PER_BATCH} meals per call. It writes them all or none.
  `,
  inputSchema: z.object({
    meals: z
      .array(
        z.object({
          date: isoDateSchema.describe(
            "Calendar day, YYYY-MM-DD. It is required.",
          ),
          recipeId: z
            .string()
            .min(1)
            .describe(
              "Id of an existing recipe, taken from 'searchRecipes'. It is required.",
            ),
          servings: z
            .number()
            .int()
            .positive()
            .max(MAX_SERVINGS)
            .optional()
            .describe("Planned servings. Omit it to use the recipe's default."),
          note: z
            .string()
            .trim()
            .max(MAX_NOTE_LENGTH)
            .optional()
            .describe("Optional short note for this meal."),
          shared: z
            .boolean()
            .describe(
              "true to share the meal with the user's household, false to keep it private to the user.",
            ),
        }),
      )
      .min(1)
      .max(MAX_MEALS_PER_BATCH)
      .describe(
        "The meals to plan, in the order they should appear within each day.",
      ),
  }),
  execute: async ({ meals }) => {
    const locale = await getRequestLocale();

    try {
      const { entries } = await api.mealPlan.addMany({ meals, locale });

      return { success: true, entries, invalidRecipeIds: [] as string[] };
    } catch (error) {
      if (
        error instanceof TRPCError &&
        error.message === MEAL_PLAN_ERRORS.recipesNotVisible
      ) {
        return {
          success: false,
          entries: [],
          invalidRecipeIds: readInvalidRecipeIds(error.cause),
        };
      }

      throw error;
    }
  },
  toModelOutput: ({ output }) => {
    if (!output.success) {
      const ids = output.invalidRecipeIds.join(", ") || "unknown";

      return {
        type: "text",
        value: `Nothing was planned. These recipe ids do not exist or are not visible to the user: ${ids}. Search again and use ids from the search results.`,
      };
    }

    return {
      type: "text",
      value: `Planned ${output.entries.length} meals:\n${formatMealPlanForModel(output.entries)}`,
    };
  },
});
