import { tool, zodSchema } from "ai";
import z from "zod";
import { generateAndUpload } from "../cloudinary";

export const toolGenerateRecipeImage = tool({
  description: `
Generates a high-quality, realistic photograph of a dish with an AI image model and
uploads it to Cloudinary, returning a URL that can be used as the recipe image.

Use it when:
1. The user asks to "see" or "visualize" a dish that has no image yet.
2. The user wants to see the result before saving the recipe.
3. You want to inspire the user with a visual representation of a culinary idea.
  `,
  inputSchema: zodSchema(
    z.object({
      recipeTitle: z
        .string()
        .describe(
          "The name of the dish to visualize (e.g., 'Creamy Mushroom Risotto').",
        ),
      styleHint: z
        .string()
        .optional()
        .describe(
          "Optional aesthetic style (e.g., 'rustic', 'dark mood', 'bright and airy').",
        ),
    }),
  ),
  execute: async ({ recipeTitle, styleHint }) => {
    try {
      const imageUrl = await generateAndUpload(recipeTitle, styleHint);

      return {
        success: true,
        imageUrl,
        // The chat renders the image itself, so the model only needs a short confirmation and
        // must never repeat this message or the url in its reply.
        message: `Image of "${recipeTitle}" is now displayed in the chat.`,
      };
    } catch (error) {
      console.error("Error in toolGenerateRecipeImage:", error);
      return {
        success: false,
        message:
          "I'm sorry, I couldn't generate the image right now. We can still proceed with the recipe text!",
      };
    }
  },
});
