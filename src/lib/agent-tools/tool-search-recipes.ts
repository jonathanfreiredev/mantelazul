import { tool } from "ai";
import z from "zod";
import { getRecipeHitsByIds } from "~/server/rag/hydrate";
import {
  DEFAULT_MIN_SIMILARITY,
  SPECIFIC_REQUEST_MIN_SIMILARITY,
} from "~/server/rag/search";
import { getRequestLocale } from "~/server/translations/request-locale";
import { api } from "~/trpc/server";
import { formatRecipeListForModel } from "./format-recipe-for-model";

export const toolSearchRecipes = tool({
  description: `
Finds recipes saved in this app, by meaning, through semantic search. It returns a summary list, not the full recipes, and it only ever covers the app's own collection.

ALWAYS pass a "query" with what the user is looking for, e.g. "something vegan and quick for dinner", "gluten-free chocolate desserts", "recipes similar to paella". Use it whenever the user describes what they want, even loosely. Put EVERYTHING descriptive (ingredients, category, difficulty, dietary needs) inside the "query", in the user's language.

A NEAREST-NEIGHBOUR SEARCH ALWAYS HAS NEIGHBOURS, SO THE LIST IS NOT AUTOMATICALLY AN ANSWER:
- With "specificRequest": true only real matches come back, and an empty list means the app simply does not have what the user asked for. Say that plainly.
- With "specificRequest": false the closest recipes come back even when the match is loose, which is what you want for browsing. Read the list before offering it and leave out the ones that do not fit.
- Either way, never present a near miss as if it answered the request.

SCOPES:
- "all" (default): everyone's published recipes, plus the current user's own unpublished ones. Use it for general inspiration and discovery.
- "mine": ONLY the recipes created by the current user, published or not. Use it when the user asks about their own recipes, e.g. "my recipes", "the ones I created", "my desserts".

FILTERS:
- maxTotalTime: maximum total time in minutes, for requests like "something under 30 minutes". Leave it out when there is no time limit; do not pass a huge number to mean "no limit".
- There is no category/difficulty/tag filter: express those in the "query" instead.

PAGINATION AND "SHOW ME MORE":
- Results include "shownIds" and "hasMore". When the user asks for more options (e.g. "show me more", "other options", "something else"), call this tool again with the SAME "query" and pass the ids from the previous "shownIds" in "excludeIds". Never repeat recipes already shown.
- Only offer more options when the previous result had "hasMore": true.

IMPORTANT:
- Never invent recipes that are supposedly in the app: only the ones this tool returns exist there.
- Do not output raw JSON. The results are rendered as cards, so do not write the list out again.
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
    specificRequest: z
      .boolean()
      .default(false)
      .describe(
        "Set to true when the user asked for something in particular: a dish by name ('a bibimbap recipe', 'risotto') or a kind of dish ('chocolate desserts', 'a soup'). Then only real matches are returned, and the list is empty when the app has none. Leave it false when the user asked for suggestions or ideas ('ideas for dinner', 'show me more', 'something quick'), where a loose match is still a valid answer.",
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
    const { matches, hasMore } = await api.recipes.semanticSearch({
      query: input.query,
      scope: input.scope,
      maxTotalTime: input.maxTotalTime,
      excludeIds: input.excludeIds,
      take: input.take,
      minSimilarity: input.specificRequest
        ? SPECIFIC_REQUEST_MIN_SIMILARITY
        : DEFAULT_MIN_SIMILARITY,
    });

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
