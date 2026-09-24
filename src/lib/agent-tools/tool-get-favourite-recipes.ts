import { tool } from "ai";
import z from "zod";
import { api } from "~/trpc/server";
import { formatRecipeListForModel } from "./format-recipe-for-model";

type FavouriteRecipe = Awaited<
  ReturnType<typeof api.recipes.getFavourites>
>[number];

/**
 * Adapts a full favourite recipe (used by the favourites page) to the compact shape the
 * agent needs, so the shared backend function stays generic.
 */
function toAgentSummary(recipe: FavouriteRecipe) {
  return {
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
}

export const toolGetFavouriteRecipes = tool({
  description: `
Retrieves the recipes the current user has liked (their favourites), newest first, paginated.

Use it when the user asks about their favourite recipes, e.g. "what are my favourite recipes", "my favourites", "what have I saved".

PAGINATION:
- The result includes "hasMore" and "nextSkip".
- When the user asks for more ("show me more options", "and more"), call this tool again using "skip" = the previous "nextSkip". Never repeat recipes that were already shown.
  `,
  inputSchema: z.object({
    skip: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of favourites to skip. Use the previous 'nextSkip'."),
    take: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5)
      .describe("Number of favourites to return. Defaults to 5."),
  }),
  execute: async ({ skip, take }) => {
    const favourites = await api.recipes.getFavourites();

    const page = favourites.slice(skip, skip + take);
    const hasMore = skip + page.length < favourites.length;
    const recipes = page.map(toAgentSummary);

    return {
      success: true,
      recipes,
      hasMore,
      shownIds: recipes.map((recipe) => recipe.id),
      nextSkip: hasMore ? skip + page.length : null,
      total: favourites.length,
    };
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: formatRecipeListForModel(output.recipes, {
      hasMore: output.hasMore,
      nextSkip: output.nextSkip,
    }),
  }),
});
