import { DEFAULT_LOCALE, type Locale } from "~/lib/locales";
import { db } from "~/server/db";
import {
  recipeWithTranslationsInclude,
  toRecipeDto,
} from "~/server/translations/resolve";
import type { RecipeDto } from "~/types/recipe";
import type { RecipeMatch, RecipeSearchHit } from "./types";

/**
 * Hydrates retrieval matches (record ids) into full recipes using Postgres as the source
 * of truth. The order of `matches` is preserved and ids that no longer exist are dropped.
 *
 * This is a plain helper used by the agent's search tool right after RAG returns; it is
 * not a tool and it is not a shared server procedure.
 */
export async function getRecipeHitsByIds(
  matches: RecipeMatch[],
  locale: Locale = DEFAULT_LOCALE,
): Promise<RecipeSearchHit[]> {
  if (matches.length === 0) return [];

  const recipes = await db.recipe.findMany({
    where: { id: { in: matches.map((match) => match.id) } },
    include: recipeWithTranslationsInclude,
  });

  const byId = new Map(
    recipes.map((recipe) => [recipe.id, toRecipeDto(recipe, locale)]),
  );

  return matches
    .map((match) => {
      const recipe = byId.get(match.id);
      return recipe ? toRecipeSearchHit(recipe, match.similarity) : null;
    })
    .filter((hit): hit is RecipeSearchHit => hit !== null);
}

function toRecipeSearchHit(
  recipe: RecipeDto,
  similarity?: number,
): RecipeSearchHit {
  const hit: RecipeSearchHit = {
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    difficulty: recipe.difficulty,
    tags: recipe.tags.map((recipeTag) => recipeTag.tag.name),
    likesCount: recipe.likesCount,
    totalTime: recipe.preparationTime + recipe.cookingTime + recipe.restingTime,
    imageUrl: recipe.imageUrl,
  };

  if (similarity !== undefined) {
    hit.similarity = Math.max(0, Math.min(1, similarity));
  }

  return hit;
}
