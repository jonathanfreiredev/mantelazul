import type { Ingredient, Recipe, Step, Tag } from "generated/prisma/client";
import type { Locale } from "~/lib/locales";
import type { IngredientUsage } from "~/lib/step-ingredients";
import type { DecimalToString } from "./decimal-to-string";

/** An ingredient with its localized name resolved for the requested language. */
export type LocalizedIngredient = DecimalToString<Ingredient> & {
  name: string;
};

/**
 * A step with its localized description resolved for the requested language, and its ingredient
 * usages parsed out of the JSON column into the shape the UI works with.
 */
export type LocalizedStep = Omit<Step, "ingredientUsages"> & {
  description: string;
  ingredientUsages: IngredientUsage[];
};

/**
 * A recipe ready to be rendered, already resolved to one language. `title`, `description`,
 * `ingredients[].name` and `steps[].description` come from the matching `RecipeTranslation`.
 */
export type RecipeDto = Recipe & {
  title: string;
  description: string;
  ingredients: LocalizedIngredient[];
  steps: LocalizedStep[];
  tags: {
    tag: Tag;
  }[];
  /** The locale the text was actually taken from, after the translation fallbacks. */
  resolvedLocale: Locale;
};
