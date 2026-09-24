import { tool, zodSchema } from "ai";
import { Category, Difficulty, Unit } from "generated/prisma/enums";
import z from "zod";
import { LOCALES } from "~/lib/locales";
import { intSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/server";
import { generateAndUpload } from "../cloudinary";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

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
      "URL of the recipe image. Omit it to let the app generate one automatically.",
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
            "Quantity of the ingredient as a number (e.g. 1, 0.5, 2.75), using a dot as the decimal separator. Up to 3 decimals are kept. It does not need to include the unit, just the numeric value. It is required.",
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
    .array(
      z
        .string()
        .trim()
        .min(1, "Step description is required")
        .describe("Description of the preparation step. It is required."),
    )
    .min(1, "At least one step is required")
    .describe(
      "Preparation steps for the recipe, listed in the order they should be performed. Each step is a clear, concise instruction for the user to follow.",
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

export const toolCreateRecipe = tool({
  description: `
Creates and stores a finalized cooking recipe.

The recipe must already be fully defined and agreed upon, with a title, an ingredients
list, step-by-step instructions and its metadata (category, difficulty, nutrition).

IMPORTANT:
- Only call this tool once the user has explicitly confirmed they want to save the recipe.
- Do NOT call it during brainstorming or suggestion phases.
- This tool requires user approval before it runs.
  `,
  inputSchema: zodSchema(recipeInputSchema),
  execute: async (recipe) => {
    const image = recipe.imageUrl
      ? recipe.imageUrl
      : await generateImageForRecipe({
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
        });

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
      imageUrl: image || null,
      locale: recipe.locale,
    });

    await api.recipes.updateIngredients({
      recipeId: newRecipe.id,
      ingredients: recipe.ingredients.map((ingredient, index) => ({
        name: ingredient.name,
        quantity: ingredient.quantity.toFixed(3),
        unit: ingredient.unit,
        order: index,
      })),
    });

    await api.recipes.updateSteps({
      recipeId: newRecipe.id,
      steps: recipe.steps.map((step, index) => ({
        description: step,
        imageUrl: null,
        order: index,
      })),
    });

    await api.recipes.updateTags({
      recipeId: newRecipe.id,
      tags: recipe.tags,
    });

    const createdRecipe = await api.recipes.getOne({ id: newRecipe.id });

    return {
      success: true,
      message: "Recipe created successfully",
      recipe: createdRecipe,
    };
  },
});

const generateImageForRecipe = async (recipe: {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  defaultServings: number;
  preparationTime: number;
  cookingTime: number;
  restingTime: number;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
}) => {
  const styleHint = await generateText({
    model: openai("gpt-6-luna"),
    prompt: `Given the following recipe details, generate a concise visual style hint for an AI image generator. The hint should describe the desired visual style, lighting, and presentation of the dish in a few words. Avoid mentioning specific camera settings or technical photography terms. Focus on the overall aesthetic and mood that would make the dish look appealing and appetizing.
    Recipe Details:
    Title: ${recipe.title}
    Description: ${recipe.description}
    Category: ${recipe.category}
    Difficulty: ${recipe.difficulty}
    Default Servings: ${recipe.defaultServings}
    Preparation Time: ${recipe.preparationTime} minutes
    Cooking Time: ${recipe.cookingTime} minutes
    Resting Time: ${recipe.restingTime} minutes
    Calories: ${recipe.calories} kcal
    Carbohydrates: ${recipe.carbohydrates} g
    Protein: ${recipe.protein} g
    Fat: ${recipe.fat} g

    Please provide the visual style hint in a single sentence.`,
  });

  const imageUrl = await generateAndUpload(recipe.title, styleHint.text);
  return imageUrl;
};
