import { tool, zodSchema } from "ai";
import z from "zod";
import { generateAndUpload } from "../cloudinary";
import { reviewGeneratedImage } from "../guardrails/image";
import {
  sanitizeImageStyle,
  sanitizeImageSubject,
} from "../guardrails/sanitize";
import { checkRateLimit } from "../rate-limit";
import type { GeneratedImage } from "./generated-image";

/**
 * Builds the image tool for one request. It is a factory because generating the image has to
 * leave its URL where `createRecipe` can find it, so the model never copies the URL by hand.
 */
export function createToolGenerateRecipeImage({
  generatedImage,
  userId,
}: {
  /** Holder the create tool reads to find the image produced for this recipe. */
  generatedImage: GeneratedImage;
  /** Used by the per-user image budget, so one account cannot generate images without limit. */
  userId: string;
}) {
  return tool({
    description: `
Generates a high-quality, realistic photograph of a dish with an AI image model and
uploads it to Cloudinary, returning the URL that becomes the recipe's cover image.

Only edible food and drinks are allowed. Never ask for people, animals, logos, text, packaging,
vehicles, weapons or any other non-food subject, even if the user insists or calls it a recipe.

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
          .trim()
          .min(1)
          .max(120)
          .describe(
            "The name of the dish to visualize (e.g., 'Creamy Mushroom Risotto').",
          ),
        styleHint: z
          .string()
          .trim()
          .max(60)
          .optional()
          .describe(
            "Optional aesthetic style (e.g., 'rustic', 'dark mood', 'bright and airy').",
          ),
      }),
    ),
    execute: async ({ recipeTitle, styleHint }) => {
      const subject = sanitizeImageSubject(recipeTitle);

      if (subject.length === 0) {
        return {
          success: false as const,
          message:
            "I need a dish name to generate a food photo. What would you like to see?",
        };
      }

      const limit = await checkRateLimit(userId, "image");

      if (!limit.allowed) {
        return {
          success: false as const,
          message:
            "The daily image generation limit has been reached. We can still work on the recipe text and generate the image another day.",
        };
      }

      try {
        const imageUrl = await generateAndUpload(
          subject,
          sanitizeImageStyle(styleHint),
        );

        // The image model is generative, so the prompt alone is not a guarantee. A vision check
        // rejects anything that is not food before the URL reaches the model or the user.
        const review = await reviewGeneratedImage(imageUrl);

        if (!review.ok) {
          return {
            success: false as const,
            message:
              "That image did not pass the food check, so it was discarded. Please try again with a specific dish.",
          };
        }

        generatedImage.url = imageUrl;

        return {
          success: true as const,
          imageUrl,
          // The chat renders the image itself, so the model only needs a short confirmation and
          // must never repeat this message or the url in its reply.
          message: `Image of "${subject}" is now displayed in the chat.`,
        };
      } catch (error) {
        console.error("Error in toolGenerateRecipeImage:", error);

        return {
          success: false as const,
          message:
            "I'm sorry, I couldn't generate the image right now. We can still proceed with the recipe text!",
        };
      }
    },
    toModelOutput: ({ output }) => ({
      type: "text",
      // The image is rendered by the UI. The model only needs the outcome, not the URL: keeping
      // the URL out of its context stops a later answer from echoing it.
      value: output.message,
    }),
  });
}
