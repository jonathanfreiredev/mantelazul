import { createHash } from "node:crypto";
import type { RecipeIndexSource, RecipeMetadata } from "./types";

/**
 * Builds the natural-language document that gets embedded for a recipe.
 *
 * The text is written as labelled prose so a natural-language question like
 * "quick vegetarian dinner with chickpeas" can match on several fields at once.
 */
export function buildRecipeDocument(source: RecipeIndexSource): string {
  const totalTime =
    source.preparationTime + source.cookingTime + source.restingTime;

  const lines = [
    `Title: ${source.title}`,
    `Description: ${source.description}`,
    `Category: ${source.category}`,
    `Difficulty: ${source.difficulty}`,
    `Servings: ${source.defaultServings}`,
    `Total time: ${totalTime} minutes`,
  ];

  if (source.tags.length > 0) {
    lines.push(`Tags: ${source.tags.join(", ")}`);
  }

  if (source.ingredients.length > 0) {
    const ingredients = source.ingredients
      .map(
        (ingredient) =>
          `${ingredient.name} (${ingredient.quantity} ${ingredient.unit})`,
      )
      .join(", ");
    lines.push(`Ingredients: ${ingredients}`);
  }

  if (source.steps.length > 0) {
    const steps = source.steps
      .map((step, index) => `${index + 1}) ${step.description}`)
      .join(" ");
    lines.push(`Steps: ${steps}`);
  }

  lines.push(
    `Nutrition per serving: ${source.calories} kcal, ${source.carbohydrates} g carbohydrates, ${source.protein} g protein, ${source.fat} g fat`,
  );

  return lines.join("\n");
}

/**
 * Builds the Chroma metadata for a recipe.
 *
 * Only what is not in the embedded document and what the vector search filters on lives
 * here; the rest is hydrated from Postgres by id after the search.
 */
export function buildRecipeMetadata(
  source: RecipeIndexSource,
  document: string,
): RecipeMetadata {
  return {
    authorId: source.authorId ?? "",
    published: source.published,
    totalTime: source.preparationTime + source.cookingTime + source.restingTime,
    contentHash: hashDocument(document),
  };
}

export function hashDocument(document: string): string {
  return createHash("sha256").update(document).digest("hex");
}
