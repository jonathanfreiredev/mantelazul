import type { Prisma } from "generated/prisma/client";
import { DEFAULT_LOCALE, toLocale, type Locale } from "~/lib/locales";
import type { RecipeDto } from "~/types/recipe";
import type {
  RecipeTranslationContent,
  TranslatedIngredient,
  TranslatedStep,
} from "./types";

export const recipeWithTranslationsInclude = {
  ingredients: { orderBy: { order: "asc" } },
  steps: { orderBy: { order: "asc" } },
  tags: { include: { tag: true } },
  translations: true,
} satisfies Prisma.RecipeInclude;

export type RecipeWithTranslations = Prisma.RecipeGetPayload<{
  include: typeof recipeWithTranslationsInclude;
}>;

type TranslationRow = {
  locale: string;
  title: string;
  description: string;
  ingredients: Prisma.JsonValue;
  steps: Prisma.JsonValue;
};

/**
 * Picks the translation to show, falling back to the canonical language and then to the source
 * language, so a recipe is never rendered empty while its translations are missing. Generic over
 * the row shape so callers can select only the fields they need.
 */
export function pickTranslation<T extends { locale: string }>(
  translations: T[],
  locale: Locale,
  sourceLocale: string,
): T | undefined {
  return (
    translations.find((row) => row.locale === locale) ??
    translations.find((row) => row.locale === DEFAULT_LOCALE) ??
    translations.find((row) => row.locale === sourceLocale) ??
    translations[0]
  );
}

function toContent(row: TranslationRow): RecipeTranslationContent {
  return {
    title: row.title,
    description: row.description,
    ingredients: (row.ingredients ?? []) as unknown as TranslatedIngredient[],
    steps: (row.steps ?? []) as unknown as TranslatedStep[],
  };
}

/**
 * Resolves a recipe (with its relations) into the shape the UI expects, in the requested
 * language. The field names are the same as before translations existed, so the UI does not
 * need to know where the text comes from.
 */
export function toRecipeDto(
  recipe: RecipeWithTranslations,
  locale: Locale,
): RecipeDto {
  const row = pickTranslation(recipe.translations, locale, recipe.sourceLocale);

  const content: RecipeTranslationContent = row
    ? toContent(row)
    : { title: "", description: "", ingredients: [], steps: [] };

  // Which language the text really came from: `locale` may have fallen back to the canonical or
  // the source language when the requested translation is missing.
  const resolvedLocale = row ? toLocale(row.locale) : locale;

  const ingredientNames = new Map(
    content.ingredients.map((ingredient) => [ingredient.order, ingredient.name]),
  );
  const stepDescriptions = new Map(
    content.steps.map((step) => [step.order, step.description]),
  );

  const { translations, ...rest } = recipe;
  void translations;

  return {
    ...rest,
    resolvedLocale,
    title: content.title,
    description: content.description,
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      name: ingredientNames.get(ingredient.order) ?? "",
      quantity: ingredient.quantity.toString(),
    })),
    steps: recipe.steps.map((step) => ({
      ...step,
      description: stepDescriptions.get(step.order) ?? "",
    })),
    tags: recipe.tags,
  };
}
