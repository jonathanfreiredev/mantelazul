import { Category, Difficulty, Unit } from "generated/prisma/enums";
import z from "zod";

export const intSchema = z.int().nonnegative("It cannot be negative");

export const recipeSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().trim(),
  category: z.enum(Category),
  difficulty: z.enum(Difficulty),
  image: z
    .object({
      file: z.instanceof(File).or(z.instanceof(Blob)),
      preview: z.url("Preview must be a valid URL").trim(),
    })
    .nullable(),
  defaultServings: z
    .int("It must be a positive number")
    .min(1, "It must be at least 1"),
  preparationTime: intSchema,
  cookingTime: intSchema,
  restingTime: intSchema,
  calories: intSchema,
  carbohydrates: intSchema,
  protein: intSchema,
  fat: intSchema,
  tags: z.array(z.string().min(1, "Tag cannot be empty").trim()),
});

export const recipeIngredientsSchema = z.object({
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Ingredient name is required"),
        // "0" is the marker for an ingredient with no amount of its own (salt, pepper, anything
        // that goes "to taste"): the column stays NOT NULL and the UI shows the name alone.
        quantity: z.string().regex(/^\d+(\.\d{1,3})?$/, "Máximo 3 decimales"),
        unit: z.enum(Unit),
        order: z.int(),
      }),
    )
    .min(1, "At least one ingredient is required"),
});

/**
 * How much of one ingredient a step consumes, written by ingredient order. This is the editor's
 * shape: it already has the recipe in hand, so it refers to ingredients the way the database does.
 */
export const stepUsageSchema = z
  .object({
    order: z.int().nonnegative(),
    part: z.int().positive(),
    of: z.int().positive(),
  })
  .refine((usage) => usage.part <= usage.of, {
    message: "A step cannot use more than the whole ingredient",
  });

/**
 * How much of one ingredient a step consumes, as the model writes it: by name, because it has
 * just written the ingredient list in the same call, and as a fraction it can copy straight from
 * the step text ("two thirds" -> part 2, of 3) instead of a decimal it would have to compute.
 *
 * No refinement here on purpose: the AI SDK turns these schemas into the tool's JSON schema, and
 * a refined schema has no JSON representation. The fraction is checked in `resolveUsagesByName`,
 * which reports the offending ingredient by name.
 */
export const stepUsageInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingredient name is required")
    .describe(
      "Exact name of one of the recipe's ingredients, written the same way as in the 'ingredients' list. It is required.",
    ),
  part: z
    .int()
    .positive()
    .optional()
    .describe(
      "Numerator of the share of that ingredient this step uses. Leave both 'part' and 'of' out when the step uses all of it. Half is part 1, of 2; two thirds is part 2, of 3.",
    ),
  of: z
    .int()
    .positive()
    .optional()
    .describe(
      "Denominator of the share. Only needed when the step uses part of the ingredient, never a decimal.",
    ),
});

/** A preparation step together with the ingredients it consumes. */
export const recipeStepInputSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Step description is required")
    .describe("Description of the preparation step. It is required."),
  ingredients: z
    .array(stepUsageInputSchema)
    .optional()
    .describe(
      "Ingredients this step consumes, with the share of each one. Only leave it out when the step consumes no ingredient at all. An ingredient with no amount, like salt or pepper, goes here by name with no 'part' and no 'of'.",
    ),
});

export const recipeStepsSchema = z.object({
  steps: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Step description is required"),
        order: z.int(),
        imageUrl: z.url("Step image URL must be a valid URL").trim().nullable(),
        image: z
          .object({
            file: z.instanceof(File).or(z.instanceof(Blob)),
            preview: z.url("Preview must be a valid URL").trim(),
          })
          .nullable(),
        ingredientUsages: z.array(stepUsageSchema),
      }),
    )
    .min(1, "At least one step is required"),
});

export const recipeTagsSchema = z.object({
  tags: z.array(z.string().min(1, "Tag cannot be empty").trim()),
});

/**
 * The whole recipe in one payload: ingredients, steps and tags.
 *
 * The agent always has the complete recipe when it writes, so it sends everything at once and the
 * recipe is translated once. The web form leaves this out and fills each part in through its own
 * page, which is why every field of `recipeSchema` stays independent.
 */
export const recipeContentSchema = z.object({
  ingredients: recipeIngredientsSchema.shape.ingredients,
  steps: z.array(recipeStepInputSchema).min(1, "At least one step is required"),
  tags: z.array(z.string().min(1, "Tag cannot be empty").trim()),
});
