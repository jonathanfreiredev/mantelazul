import { Category, Difficulty, Unit } from "generated/prisma/enums";
import z from "zod";

export const intSchema = z.int("It must be a positive number");

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
        quantity: z.string().regex(/^\d+(\.\d{1,3})?$/, "Máximo 3 decimales"),
        unit: z.enum(Unit),
        order: z.int(),
      }),
    )
    .min(1, "At least one ingredient is required"),
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
      }),
    )
    .min(1, "At least one step is required"),
});

export const recipeTagsSchema = z.object({
  tags: z.array(z.string().min(1, "Tag cannot be empty").trim()),
});
