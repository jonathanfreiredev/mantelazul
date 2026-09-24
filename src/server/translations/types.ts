import type { Locale } from "~/lib/locales";

export interface TranslatedIngredient {
  order: number;
  name: string;
}

export interface TranslatedStep {
  order: number;
  description: string;
}

/**
 * The text of one recipe in one language. Everything locale-independent (quantities, units,
 * times, nutrition, images) lives outside of this and is shared by every locale.
 */
export interface RecipeTranslationContent {
  title: string;
  description: string;
  ingredients: TranslatedIngredient[];
  steps: TranslatedStep[];
}

/** One entry per locale that has a translation. A recipe always has at least its source locale. */
export type RecipeTranslations = Partial<Record<Locale, RecipeTranslationContent>>;
