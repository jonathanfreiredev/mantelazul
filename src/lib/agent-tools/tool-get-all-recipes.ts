import { tool } from "ai";
import { Category, Difficulty } from "generated/prisma/enums";
import z from "zod";
import { api } from "~/trpc/server";

export const toolGetAllRecipes = tool({
  description: `
Retrieves all recipes in the app by all users. 
This tool is useful for browsing the entire recipe collection, discovering new dishes, and finding inspiration from the community's culinary creations. 
It can be used to explore a wide variety of recipes across different cuisines, dietary preferences, and cooking styles. 
By accessing all recipes, users can expand their culinary horizons and find new ideas for meals to prepare.

IMPORTANT:
- This tool retrieves recipes from all users, not just the current user. It is meant for browsing the entire recipe collection in the app.
- Do not use this tool when the user specifically wants to see only their own recipes. In that case, use the 'getAllRecipesByUser' tool instead.
- This tool can return a large number of recipes, so it includes pagination parameters (skip and take) to manage the amount of data returned in each request.
- The input parameters allow for filtering and sorting the recipes based on various criteria such as category, difficulty, and search terms. Use these parameters to help the user find recipes that match their interests and needs.
  `,
  inputSchema: z.object({
    category: z
      .enum(Category)
      .optional()
      .describe(
        "Filter recipes by category. This can help narrow down the search to specific types of dishes, such as appetizers, main courses, desserts, etc.",
      ),
    difficulty: z
      .enum(Difficulty)
      .optional()
      .describe(
        "Filter recipes by difficulty level. This allows users to find recipes that match their cooking skill level, whether they are beginners looking for easy recipes or experienced cooks seeking a challenge.",
      ),
    search: z
      .string()
      .optional()
      .describe(
        "Search term to filter recipes by name or ingredients. This can help users quickly find recipes that include specific ingredients they have on hand or dishes they are interested in. It can be used to search for recipes by title, description or tag that might be included in the recipe's title, description or tags.",
      ),
    skip: z
      .number()
      .min(0)
      .default(0)
      .optional()
      .describe(
        "Number of recipes to skip for pagination. It is optional and defaults to 0 if not provided. Use this parameter to navigate through pages of recipes when there are too many to display at once.",
      ),
    take: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .describe(
        "Number of recipes to return for pagination. It is optional and defaults to 20 if not provided. The maximum allowed value is 100 to prevent excessive data retrieval.",
      ),
  }),
  execute: async ({ category, difficulty, search, skip = 0, take = 20 }) => {
    console.log("Executing toolGetAllRecipes");
    const recipes = await api.recipes.getAll({
      category,
      difficulty,
      search,
      skip,
      take,
    });

    return {
      success: true,
      message: "Recipes retrieved successfully",
      recipes,
    };
  },
});
