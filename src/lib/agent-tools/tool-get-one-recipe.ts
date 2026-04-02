import { tool } from "ai";
import z from "zod";
import { api } from "~/trpc/server";

export const toolGetOneRecipe = tool({
  description: `
Retrieves a single recipe by its ID.
This tool is useful for allowing users to view the details of a specific recipe, such as its ingredients, preparation steps, and nutritional information. It can be used in various contexts, such as when a user clicks on a recipe from a list to see more details or when they want to edit an existing recipe.

IMPORTANT: This tool requires the ID of the recipe to retrieve. The ID should be provided as input when calling this tool.
  `,
  inputSchema: z.object({
    id: z
      .string()
      .describe("The ID of the recipe to retrieve. It is required."),
  }),
  execute: async ({ id }) => {
    console.log(
      "Executing toolGetOneRecipe to retrieve the recipe with ID:",
      id,
      "---",
    );
    const recipe = await api.recipes.getOne({ id });

    return {
      success: true,
      message: "Recipe retrieved successfully",
      recipe,
    };
  },
});
