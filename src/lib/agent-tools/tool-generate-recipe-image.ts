import { tool, zodSchema } from "ai";
import z from "zod";
import { generateAndUpload } from "../cloudinary";

export const toolGenerateRecipeImage = tool({
  description: `
    Generates a high-quality, realistic professional photograph of a dish. The image is created using an AI image generation model and then uploaded to Cloudinary, returning a URL that can be used to display the image in the recipe.
    
    Use this tool when:
    1. The user asks to "see" a recipe or "visualize" a dish if the recipe doesn't have an image yet.
    2. The user wants to see the result before saving/creating the recipe.
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
        imageUrl: imageUrl,
        message: `I've generated a professional photo of the ${recipeTitle}. It looks delicious!`,
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
