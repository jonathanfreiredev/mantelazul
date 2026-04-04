import { tool, zodSchema } from "ai";
import { Category, Difficulty, Unit } from "generated/prisma/enums";
import z from "zod";
import { intSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/server";

const recipeInputSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .describe("The name of the recipe. It is required."),
  description: z
    .string()
    .describe("Short description of the dish It is required."),
  category: z
    .enum(Category)
    .describe(
      "The category of the recipe. Category in UPPERCASE (e.g., MAIN_COURSE, DESSERT). It is required.",
    ),
  difficulty: z
    .enum(Difficulty)
    .describe(
      "The difficulty level of the recipe. Difficulty in UPPERCASE (e.g., EASY, MEDIUM, HARD). It is required.",
    ),
  imageUrl: z.url().describe("URL of the recipe image. It is required."),
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
        quantity: z
          .number()
          .describe(
            "Quantity of the ingredient (e.g., '1', '0.5', '2.75'). It can be a decimal number represented as a string with a dot as the decimal separator. Maximum 3 decimal places. It does not need to include the unit, just the numeric value. It is required.",
          ),
        unit: z
          .enum(Unit)
          .describe(
            "Unit of measurement for the ingredient. Unit in UPPERCASE (e.g., GRAM, CUP, TABLESPOON). It is required.",
          ),
      }),
    )
    .min(1, "At least one ingredient is required")
    .describe(
      "List of ingredients for the recipe. Each ingredient includes a name, quantity, and unit of measurement. List the ingredients in the order they are used in the recipe.",
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
      "List of preparation steps for the recipe. List the steps in the order they should be performed. Each step should be a clear and concise instruction for the user to follow. Minimum 1 step is required.",
    ),
  tags: z
    .array(z.string())
    .describe(
      "List of tags for the recipe. E.g., 'vegan', 'gluten-free', etc. It does not need a hash symbol (#) before the tag name. Tags have to be in the same language as the recipe.",
    ),
});

export const toolCreateRecipe = tool({
  description: `
Creates and stores a finalized cooking recipe after the user has explicitly approved it.

IMPORTANT:
- Only call this tool when the user has clearly confirmed they want to create/save the recipe.
- Do NOT call this tool during brainstorming or suggestion phases.
- The recipe must already be fully defined and agreed upon.
- Add an image to the recipe. If the user has provided an image, first ask them to use this image in the recipe. If they confirm,
  use the URL of that image in the recipe.
- If the user has not provided an image, you can generate a relevant image using an image generation tool and include it in the recipe.

The recipe should include a clear title, ingredients list, step-by-step instructions, and relevant metadata (e.g., category, difficulty, nutritional info).
  `,
  inputSchema: zodSchema(recipeInputSchema),
  needsApproval: true,
  execute: async (recipe) => {
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
      imageUrl: recipe.imageUrl || null,
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
