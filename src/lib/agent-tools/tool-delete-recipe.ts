import { tool, zodSchema } from "ai";
import z from "zod";
import { api } from "~/trpc/server";

export const toolDeleteRecipe = tool({
  description: `
Deletes an existing recipe permanently. This also removes it from the search index.

IMPORTANT:
- Only call this tool after the user has explicitly confirmed they want to delete the recipe.
- You must know the recipe id first. If you only have the title, use 'searchRecipes' to find it and confirm with the user.
- This tool requires user approval before it runs.
  `,
  inputSchema: zodSchema(
    z.object({
      id: z
        .string()
        .min(1)
        .describe("The id of the recipe to delete. It is required."),
    }),
  ),
  execute: async ({ id }) => {
    await api.recipes.delete({ id });

    return {
      success: true,
      message: "Recipe deleted successfully",
      recipeId: id,
    };
  },
});
