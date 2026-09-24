import z from "zod";
import { LOCALES } from "~/lib/locales";

const translatedIngredientSchema = z.object({
  order: z.int(),
  name: z.string().trim().min(1),
});

const translatedStepSchema = z.object({
  order: z.int(),
  description: z.string().trim().min(1),
});

export const recipeTranslationContentSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim(),
  ingredients: z.array(translatedIngredientSchema).min(1),
  steps: z.array(translatedStepSchema).min(1),
});

/** One entry per supported locale, keyed by locale code. */
export const recipeTranslationsSchema = z.object(
  Object.fromEntries(
    LOCALES.map((locale) => [locale, recipeTranslationContentSchema]),
  ) as Record<string, typeof recipeTranslationContentSchema>,
);
