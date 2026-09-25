import { tool, zodSchema } from "ai";
import { Category, Difficulty, Unit } from "generated/prisma/enums";
import z from "zod";
import { LOCALES } from "~/lib/locales";
import { intSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/server";

const recipeInputSchema = z.object({
  id: z
    .cuid()
    .describe(
      "The unique identifier of the recipe to be updated. It is required.",
    ),
  sourceLocale: z
    .enum(LOCALES)
    .describe(
      "Language the recipe is written in, as an ISO 639-1 code: 'en' (English), 'es' (Spanish) or 'de' (German). Omit it to keep the current source language. Set it only when the user wants to change the language the recipe is written in; the text you send is then treated as being in that language and the other languages are regenerated from it.",
    )
    .optional(),
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
  imageUrl: z
    .url()
    .optional()
    .describe("URL of the recipe image, or omit it to keep the current one."),
  difficulty: z
    .enum(Difficulty)
    .describe(
      "The difficulty level of the recipe, in UPPERCASE (e.g. EASY, MEDIUM, HARD). It is required.",
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
});

export const toolUpdateRecipe = tool({
  description: `
Updates an existing recipe. Use it when the user wants to change a recipe that already exists.

The input carries the recipe id plus the full recipe (title, description, ingredients,
steps and metadata). Include every field, even the ones that do not change, so the recipe
stays complete and consistent after the update.

IMPORTANT:
- Only call this tool once the user has explicitly confirmed they want the change.
- Do NOT call it during brainstorming or suggestion phases.
- Call 'getOneRecipe' first to read the recipe, then send it back with only the requested change.
- To change the language the recipe is written in, set 'sourceLocale' and send the title,
  description, ingredients and steps in that language.
- This tool requires user approval before it runs.
  `,
  inputSchema: zodSchema(recipeInputSchema),
  execute: async (recipe) => {
    const newRecipe = await api.recipes.update({
      id: recipe.id,
      sourceLocale: recipe.sourceLocale,
      recipe: {
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
        tags: recipe.tags,
      },
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

    const updatedRecipe = await api.recipes.getOne({ id: newRecipe.id });

    return {
      success: true,
      message: "Recipe updated successfully",
      recipe: updatedRecipe,
    };
  },
});
