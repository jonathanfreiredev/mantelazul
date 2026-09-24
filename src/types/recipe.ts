import type { Ingredient, Recipe, Step, Tag } from "generated/prisma/client";
import type { DecimalToString } from "./decimal-to-string";

/** An ingredient with its localized name resolved for the requested language. */
export type LocalizedIngredient = DecimalToString<Ingredient> & { name: string };

/** A step with its localized description resolved for the requested language. */
export type LocalizedStep = Step & { description: string };

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
};
