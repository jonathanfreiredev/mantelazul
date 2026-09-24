import { toLocale, type Locale } from "~/lib/locales";
import { db } from "~/server/db";
import type {
  RecipeTranslationContent,
  TranslatedIngredient,
  TranslatedStep,
} from "./types";

export interface SourceContent {
  sourceLocale: Locale;
  content: RecipeTranslationContent;
}

/**
 * Reads the authoritative text of a recipe: the translation row of its source locale.
 *
 * Mutations read this, build the next source content from the change, generate every locale and
 * only then write to the database, so a failed translation never leaves a half-updated recipe.
 */
export async function readSourceContent(
  recipeId: string,
): Promise<SourceContent | null> {
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { sourceLocale: true, translations: true },
  });

  if (!recipe) return null;

  const sourceLocale = toLocale(recipe.sourceLocale);
  const source =
    recipe.translations.find((row) => row.locale === sourceLocale) ??
    recipe.translations[0];

  if (!source) return null;

  return {
    sourceLocale,
    content: {
      title: source.title,
      description: source.description,
      ingredients: (source.ingredients ?? []) as unknown as TranslatedIngredient[],
      steps: (source.steps ?? []) as unknown as TranslatedStep[],
    },
  };
}
