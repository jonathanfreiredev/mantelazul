import { tool } from "ai";
import z from "zod";
import { getRecipeHitsByIds } from "~/server/rag/hydrate";
import { getRequestLocale } from "~/server/translations/request-locale";
import { api } from "~/trpc/server";
import { formatRecipeListForModel } from "./format-recipe-for-model";

export const toolSearchRecipes = tool({
  description: `
Finds recipes by meaning through semantic search. Returns a summary list, not the full recipes.

ALWAYS pass a "query" with what the user is looking for, e.g. "something vegan and quick for dinner", "gluten-free chocolate desserts", "recipes similar to paella". Use it whenever the user describes what they want, even loosely. Put EVERYTHING descriptive (ingredients, category, difficulty, dietary needs) inside the "query", in the user's language.

SCOPES:
- "all" (default): everyone's published recipes, plus the current user's own unpublished ones. Use it for general inspiration and discovery.
- "mine": ONLY the recipes created by the current user, published or not. Use it when the user asks about their own recipes, e.g. "my recipes", "the ones I created", "my desserts".

FILTERS:
- maxTotalTime: maximum total time in minutes, for requests like "something under 30 minutes".
- There is no category/difficulty/tag filter: express those in the "query" instead.

PAGINATION AND "SHOW ME MORE":
- Results include "shownIds" and "hasMore". When the user asks for more options (e.g. "show me more", "other options", "something else"), call this tool again with the SAME "query" and pass the ids from the previous "shownIds" in "excludeIds". Never repeat recipes already shown.
- Only offer more options when the previous result had "hasMore": true.

IMPORTANT:
- Do not invent recipes. Only describe recipes returned by this tool.
- Present results as a short, readable list (title, category, difficulty, total time, tags). Do not output raw JSON.
- If a result list is empty, say so and suggest adjusting the criteria.
  `,
  inputSchema: z.object({
    query: z
      .string()
      .trim()
      .min(1)
      .describe(
        "Natural-language search query in the user's language, including any category, difficulty or dietary criteria.",
      ),
    scope: z
      .enum(["all", "mine"])
      .default("all")
      .describe(
        "Which recipes to consider: 'all' for everyone's published recipes plus the current user's own unpublished ones, 'mine' for the current user's own recipes only.",
      ),
    maxTotalTime: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Maximum total time in minutes (e.g. 30)."),
    excludeIds: z
      .array(z.string())
      .optional()
      .describe(
        "Recipe ids already shown to the user. Use the previous result's 'shownIds' to get new options.",
      ),
    take: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5)
      .describe("Number of recipes to return. Defaults to 5, max 20."),
  }),
  execute: async (input) => {
    const { matches, hasMore } = await api.recipes.semanticSearch(input);

    const locale = await getRequestLocale();
    const recipes = await getRecipeHitsByIds(matches, locale);

    return {
      success: true,
      recipes,
      hasMore,
      shownIds: recipes.map((recipe) => recipe.id),
    };
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: formatRecipeListForModel(output.recipes, {
      hasMore: output.hasMore,
    }),
  }),
});
