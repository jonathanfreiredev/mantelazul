import { tool } from "ai";
import z from "zod";
import { api } from "~/trpc/server";

export const toolGetAllCreatedRecipesByUser = tool({
  description: `
Retrieves all recipes created by the currently authenticated user.
This tool is useful for allowing users to view and manage their own recipes, such as editing them. It can also be used to display a user's recipe collection in their profile or dashboard.

IMPORTANT: This tool does not take any input, it simply returns the list of recipes created by the authenticated user.
  `,
  inputSchema: z.object({}),
  execute: async () => {
    console.log(
      "Executing toolGetAllRecipesByUser to retrieve all recipes created by the authenticated user...",
    );
    const recipes = await api.recipes.getAllCreatedByUser();

    return {
      success: true,
      message: "Recipes retrieved successfully",
      recipes,
    };
  },
});
