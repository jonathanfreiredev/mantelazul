import { tool, zodSchema } from "ai";
import z from "zod";
import { generateAndUpload } from "../cloudinary";
import type { GeneratedImage } from "./generated-image";

/**
 * Builds the image tool for one request. It is a factory because generating the image has to
 * leave its URL where `createRecipe` can find it, so the model never copies the URL by hand.
 */
export function createToolGenerateRecipeImage({
  generatedImage,
}: {
  /** Holder the create tool reads to find the image produced for this recipe. */
  generatedImage: GeneratedImage;
}) {
  return tool({
    description: `
Generates a high-quality, realistic photograph of a dish with an AI image model and
uploads it to Cloudinary, returning the URL that becomes the recipe's cover image.

Use it when:
1. You are about to call 'createRecipe' and the recipe has no image yet: neither a photo the
   user attached nor one generated earlier in this conversation. Call this first, and the
   recipe will pick the image up on its own.
2. The user asks to "see" or "visualize" a dish that has no image yet.
3. The user wants to see the result before saving the recipe.
4. You want to inspire the user with a visual representation of a culinary idea.
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

        generatedImage.url = imageUrl;

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
}
