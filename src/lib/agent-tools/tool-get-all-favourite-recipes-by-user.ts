import { tool } from "ai";
import z from "zod";
import { api } from "~/trpc/server";

export const toolGetAllFavouriteRecipesByUser = tool({
  description: `
Retrieves all favourite recipes of the currently authenticated user.
This tool is useful for allowing users to view and manage their favourite recipes, such as removing them from their favourites list. It can also be used to display a user's favourite recipe collection in their profile or dashboard.

IMPORTANT: This tool does not take any input, it simply returns the list of favourite recipes of the authenticated user.
  `,
  inputSchema: z.object({}),
  execute: async () => {
    console.log(
      "Executing toolGetAllFavouriteRecipesByUser to retrieve all recipes created by the authenticated user...",
    );
    const recipes = await api.recipes.getAllFavouritesByUser();

    return {
      success: true,
      message: "Recipes retrieved successfully",
      recipes,
    };
  },
});
