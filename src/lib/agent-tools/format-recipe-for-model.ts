import type { Unit } from "generated/prisma/enums";
import type { MealPlanEntryDto } from "~/types/meal-plan";
import type { RecipeSearchHit } from "~/server/rag/types";
import { formatUnit } from "~/lib/units";

/** A recipe summary as returned by the favourites tool (not a search hit). */
export interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string[];
  likesCount: number;
  totalTime: number;
  imageUrl: string | null;
}

/** Full recipe as returned by `getOne`, with its ingredients and steps. */
export interface RecipeDetail {
  id: string;
  sourceLocale: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  defaultServings: number;
  preparationTime: number;
  cookingTime: number;
  restingTime: number;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  ingredients: {
    name: string;
    quantity: string;
    unit: Unit;
    order: number;
  }[];
  steps: { description: string; order: number }[];
  tags: { tag: { name: string } }[];
}

interface RecipeListOptions {
  hasMore: boolean;
  /** Offset to pass as "skip" on the next call, when the tool paginates. */
  nextSkip?: number | null;
}

function summarizeRecipe(recipe: RecipeSearchHit | RecipeSummary): string {
  const parts = [recipe.category, recipe.difficulty, `${recipe.totalTime} min`];
  if (recipe.tags.length > 0) parts.push(`tags: ${recipe.tags.join(", ")}`);
  return `${recipe.title} — ${parts.join(", ")}`;
}

/**
 * Renders a page of recipes as compact plain text for the model. Keeps the ids (the model
 * needs them to call other tools) and drops everything it does not need to answer
 * (slug, image url, similarity, likes, success flags).
 */
export function formatRecipeListForModel(
  recipes: (RecipeSearchHit | RecipeSummary)[],
  { hasMore, nextSkip }: RecipeListOptions,
): string {
  if (recipes.length === 0) return "No recipes matched the query.";

  const lines = [
    `Found ${recipes.length} recipes${hasMore ? " (more available)" : ""}:`,
    ...recipes.map(
      (recipe, index) => `${index + 1}. ${summarizeRecipe(recipe)}`,
    ),
    `IDs: ${recipes.map((recipe) => recipe.id).join(", ")}`,
  ];

  if (hasMore && nextSkip !== undefined && nextSkip !== null) {
    lines.push(
      `Next skip: ${nextSkip} (call this tool again with skip=${nextSkip} to show more)`,
    );
  }

  return lines.join("\n");
}

/**
 * Renders a slice of the meal calendar as compact plain text for the model: one line per meal,
 * with the day first so a whole plan reads as a schedule.
 */
export function formatMealPlanForModel(entries: MealPlanEntryDto[]): string {
  if (entries.length === 0) return "Nothing is planned in that range.";

  return entries
    .map((entry) => {
      const servings =
        entry.servings === null
          ? `default servings (${entry.recipe.defaultServings})`
          : `${entry.servings} servings`;
      const visibility = entry.isPrivate
        ? "private to the user"
        : "shared with the household";
      const note = entry.note ? ` | note: ${entry.note}` : "";

      return `- ${entry.date}: ${entry.recipe.title} | ${servings} | ${visibility}${note}`;
    })
    .join("\n");
}

/** Renders a full recipe as plain text sections for the model. */
export function formatRecipeDetailForModel(recipe: RecipeDetail): string {
  const ingredients = recipe.ingredients
    .map(
      (ingredient) =>
        `- ${ingredient.quantity} ${formatUnit(ingredient.unit)} ${ingredient.name}`,
    )
    .join("\n");

  const steps = recipe.steps
    .map((step, index) => `${index + 1}. ${step.description}`)
    .join("\n");

  const tags = recipe.tags.map((recipeTag) => recipeTag.tag.name).join(", ");

  return [
    `Recipe: ${recipe.title} (id: ${recipe.id})`,
    `Source language: ${recipe.sourceLocale}`,
    `Category: ${recipe.category} | Difficulty: ${recipe.difficulty} | Servings: ${recipe.defaultServings}`,
    `Total time: ${recipe.preparationTime + recipe.cookingTime + recipe.restingTime} min (prep ${recipe.preparationTime}, cook ${recipe.cookingTime}, rest ${recipe.restingTime})`,
    `Description: ${recipe.description}`,
    "",
    "Ingredients:",
    ingredients,
    "",
    "Steps:",
    steps,
    "",
    `Nutrition (per serving): ${recipe.calories} kcal | ${recipe.carbohydrates} g carbs | ${recipe.protein} g protein | ${recipe.fat} g fat`,
    `Tags: ${tags || "none"}`,
  ].join("\n");
}
