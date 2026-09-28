import { tool, zodSchema } from "ai";
import { Category, Difficulty, Unit } from "generated/prisma/enums";
import z from "zod";
import { LOCALES } from "~/lib/locales";
import {
  intSchema,
  recipeStepInputSchema,
} from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/server";
import type { GeneratedImage } from "./generated-image";

const recipeInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .describe("The name of the recipe. It is required."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .describe("Short description of the dish. It is required."),
  category: z
    .enum(Category)
    .describe(
      "The category of the recipe, in UPPERCASE (e.g. MAIN_COURSE, DESSERT). It is required.",
    ),
  difficulty: z
    .enum(Difficulty)
    .describe(
      "The difficulty level of the recipe, in UPPERCASE (e.g. EASY, MEDIUM, HARD). It is required.",
    ),
  imageUrl: z
    .url()
    .optional()
    .describe(
      "URL of the recipe image, only when it comes from neither the image the user attached nor one generated in this conversation. To use the attached image, set 'useAttachedImage' instead of writing its URL here.",
    ),
  useAttachedImage: z
    .boolean()
    .optional()
    .describe(
      "Set it to true to use the image the user attached to the conversation as the recipe's cover photo. The app already knows that image's URL: never write the URL yourself. Only set it when the attached image is a photo of the dish itself; never for a recipe card, a menu, a poster or any other image that is not the dish.",
    ),
  reuseGeneratedImage: z
    .boolean()
    .optional()
    .describe(
      "Set it to true to reuse the image generated earlier in this conversation instead of generating a new one. Use it when the user asks to save a recipe with the image you already showed them. Leave it out when the recipe you are saving is a different dish: it would get the wrong photo.",
    ),
  defaultServings: intSchema
    .min(1, "It must be at least 1")
    .describe(
      "Default number of servings. It has to be a number. It is required.",
    ),
  preparationTime: intSchema.describe(
    "Preparation time in minutes. It is required.",
  ),
  cookingTime: intSchema.describe("Cooking time in minutes. It is required."),
  restingTime: intSchema.describe("Resting time in minutes. It is required."),
  calories: intSchema.describe("Total calories per serving. It is required."),
  carbohydrates: intSchema.describe(
    "Total carbohydrates per serving. It is required.",
  ),
  protein: intSchema.describe("Total protein per serving. It is required."),
  fat: intSchema.describe("Total fat per serving. It is required."),
  ingredients: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Ingredient name is required")
          .describe("Name of the ingredient. It is required."),
        quantity: z.coerce
          .number()
          .describe(
            "Quantity of the ingredient as a number (e.g. 1, 0.5, 2.75), using a dot as the decimal separator. Up to 3 decimals are kept. It does not need to include the unit, just the numeric value. Use 0 for an ingredient with no amount of its own, like salt, pepper or anything that goes 'to taste': the app then shows its name alone. It is required.",
          ),
        unit: z
          .enum(Unit)
          .describe(
            "Unit of measurement for the ingredient, in UPPERCASE (e.g. GRAM, CUP, TABLESPOON). It is required.",
          ),
      }),
    )
    .min(1, "At least one ingredient is required")
    .describe(
      "Ingredients for the recipe, one entry each, in the order they are used. Each ingredient has a name, a numeric quantity and a unit of measurement.",
    ),
  steps: z
    .array(recipeStepInputSchema)
    .min(1, "At least one step is required")
    .describe(
      "Preparation steps for the recipe, listed in the order they should be performed. Each step carries its instruction and the ingredients it consumes.",
    ),
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty"))
    .describe(
      "Tags for the recipe, e.g. 'vegan', 'gluten-free'. Do not prefix them with '#'. Tags must be in the same language as the recipe.",
    ),
  locale: z
    .enum(LOCALES)
    .describe(
      "Language the recipe is written in, as an ISO 639-1 code: 'en' (English), 'es' (Spanish) or 'de' (German). Use the language the user is speaking. The app translates the recipe into the other languages automatically. It is required.",
    ),
});

/**
 * Builds the create-recipe tool for one request. It is a factory because the image lives in the
 * request, not in the tool: the agent asks for the attached photo with `useAttachedImage` and for
 * a generated one with the image tool, and this resolves the URL itself.
 */
export function createToolCreateRecipe({
  attachedImageUrl,
  generatedImage,
  previousImageUrl,
}: {
  /** URL of the image the user attached to the conversation, already uploaded, or null. */
  attachedImageUrl: string | null;
  /** Image generated during this request, written by the image tool as soon as it runs. */
  generatedImage: GeneratedImage;
  /** Image generated in an earlier message of this conversation, or null. */
  previousImageUrl: string | null;
}) {
  return tool({
    description: `
Creates and stores a finalized cooking recipe.

The recipe must already be fully defined and agreed upon, with a title, an ingredients
list, step-by-step instructions and its metadata (category, difficulty, nutrition).

Every step also declares the ingredients it consumes, with the share of each one: all of it by
default, or a fraction (part/of) when the step uses only part of an ingredient. Split an
ingredient across steps the way the instructions describe it.

IMPORTANT:
- Only call this tool once the user has explicitly confirmed they want to save the recipe.
- Do NOT call it during brainstorming or suggestion phases.
- The recipe needs a cover image. If the user attached a photo of the dish, set
  'useAttachedImage': true; otherwise call 'generateRecipeImage' first. This tool refuses to
  save a recipe without an image.
  `,
    inputSchema: zodSchema(recipeInputSchema),
    execute: async (recipe) => {
      // The image never travels through the model: the attached one arrives as a flag, the one
      // generated during this request is left in the holder by the image tool, and an image from
      // an earlier message is reused only when the agent explicitly asks for it, because by then
      // it may well be talking about a different dish.
      const image =
        (recipe.useAttachedImage ? attachedImageUrl : null) ??
        recipe.imageUrl ??
        generatedImage.url ??
        (recipe.reuseGeneratedImage ? previousImageUrl : null);

      if (!image) {
        return {
          success: false as const,
          message:
            "The recipe was not saved because it has no image. Call 'generateRecipeImage' with the recipe title and save it again: the generated image is used as the cover automatically. If the user attached a photo of the dish, set 'useAttachedImage': true instead.",
        };
      }

      // Everything goes in one write, so the recipe is translated once instead of once per part.
      const newRecipe = await api.recipes.create({
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        difficulty: recipe.difficulty,
        defaultServings: recipe.defaultServings,
        preparationTime: recipe.preparationTime,
        cookingTime: recipe.cookingTime,
        restingTime: recipe.restingTime,
        calories: recipe.calories,
        carbohydrates: recipe.carbohydrates,
        protein: recipe.protein,
        fat: recipe.fat,
        imageUrl: image,
        locale: recipe.locale,
        content: {
          ingredients: recipe.ingredients.map((ingredient, index) => ({
            name: ingredient.name,
            quantity: ingredient.quantity.toFixed(3),
            unit: ingredient.unit,
            order: index,
          })),
          steps: recipe.steps,
          tags: recipe.tags,
        },
      });

      const createdRecipe = await api.recipes.getOne({ id: newRecipe.id });

      return {
        success: true as const,
        message: "Recipe created successfully",
        recipe: createdRecipe,
      };
    },
    toModelOutput: ({ output }) => ({
      type: "text",
      // The chat renders the card itself, so the model gets a short line instead of the whole
      // recipe back, which it does not need and would only be tempted to repeat.
      value: output.success
        ? `Recipe "${output.recipe.title}" was created. It is already shown in the chat: do not repeat it, just add a short sentence.`
        : output.message,
    }),
  });
}
