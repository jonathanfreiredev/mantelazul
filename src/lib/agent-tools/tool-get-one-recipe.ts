import { tool } from "ai";
import z from "zod";
import { api } from "~/trpc/server";
import {
  formatRecipeDetailForModel,
  type RecipeDetail,
} from "./format-recipe-for-model";

export const toolGetOneRecipe = tool({
  description: `
Retrieves a single recipe by its id, with its full details: ingredients, preparation
steps and nutritional information.

The recipe is returned in the language it was originally written in, so you can safely read it,
change only what the user asked for and send it back with 'updateRecipe' without altering the
other languages. Present it to the user in the language of the conversation.

Use it to show a recipe in detail, before updating or deleting one, or when you only have
an id from a previous tool result and need the rest of the recipe.
  `,
  inputSchema: z.object({
    id: z
      .string()
      .min(1, "The recipe id is required")
      .describe("The ID of the recipe to retrieve. It is required."),
  }),
  execute: async ({ id }) => {
    console.log(
      "Executing toolGetOneRecipe to retrieve the recipe with ID:",
      id,
      "---",
    );
    const recipe = await api.recipes.getOne({ id, locale: "source" });

    return {
      success: true,
      message: "Recipe retrieved successfully",
      recipe,
    };
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: formatRecipeDetailForModel(output.recipe as RecipeDetail),
  }),
});
