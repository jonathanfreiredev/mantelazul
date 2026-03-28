import { Category, Difficulty, Unit } from "generated/prisma/enums";
import slugify from "slugify";
import z from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import type { RecipeDto } from "~/types/recipe";
import { recipeIngredientsSchema, recipeSchema } from "./validation";
import { deleteImageByUrl } from "../images/service";
import type { Prisma } from "generated/prisma/client";

const reservedSlugs = ["new"];

export const recipesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      recipeSchema
        .extend({
          imageUrl: z.url().trim().nullable(),
        })
        .omit({ image: true }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.title, {
        replacement: "-",
        lower: true,
        strict: true,
        trim: true,
      });

      if (reservedSlugs.includes(slug)) {
        throw new Error(
          "The title 'new' is reserved. Please choose a different title.",
        );
      }

      const existingRecipe = await ctx.db.recipe.findUnique({
        where: { slug },
      });

      if (existingRecipe) {
        throw new Error(
          "A recipe with this title already exists. Please choose a different title.",
        );
      }

      const newRecipe = await ctx.db.recipe.create({
        data: {
          title: input.title,
          description: input.description,
          slug,
          imageUrl: input.imageUrl,
          category: input.category,
          difficulty: input.difficulty,
          defaultServings: input.defaultServings,
          preparationTime: input.preparationTime,
          cookingTime: input.cookingTime,
          restingTime: input.restingTime,
          calories: input.calories,
          carbohydrates: input.carbohydrates,
          protein: input.protein,
          fat: input.fat,
          ingredients: {
            create: {
              name: "New ingredient",
              quantity: "0",
              unit: Unit.GRAM,
              order: 0,
            },
          },
          steps: {
            create: {
              description: "New step",
              order: 0,
            },
          },
          author: { connect: { id: ctx.session.user.id } },
        },
      });

      return newRecipe;
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        recipe: recipeSchema
          .extend({
            imageUrl: z.url().trim().nullable(),
          })
          .omit({ image: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, recipe } = input;

      const slug = slugify(recipe.title, {
        replacement: "-",
        lower: true,
        strict: true,
        trim: true,
      });

      if (reservedSlugs.includes(slug)) {
        throw new Error(
          "The title 'new' is reserved. Please choose a different title.",
        );
      }

      const existingRecipe = await ctx.db.recipe.findUnique({
        where: { slug, NOT: { id } },
      });

      if (existingRecipe) {
        throw new Error(
          "A recipe with this title already exists. Please choose a different title.",
        );
      }

      const currentRecipe = await ctx.db.recipe.findUnique({
        where: { id },
      });

      if (!currentRecipe) {
        throw new Error("Recipe not found");
      }

      if (
        currentRecipe.imageUrl &&
        currentRecipe.imageUrl !== recipe.imageUrl
      ) {
        await deleteImageByUrl(currentRecipe.imageUrl);
      }

      const updatedRecipe = await ctx.db.recipe.update({
        where: { id },
        data: {
          title: recipe.title,
          description: recipe.description,
          category: recipe.category,
          difficulty: recipe.difficulty,
          slug,
          imageUrl: recipe.imageUrl,
          defaultServings: recipe.defaultServings,
          preparationTime: recipe.preparationTime,
          cookingTime: recipe.cookingTime,
          restingTime: recipe.restingTime,
          calories: recipe.calories,
          carbohydrates: recipe.carbohydrates,
          protein: recipe.protein,
          fat: recipe.fat,
        },
      });

      return updatedRecipe;
    }),

  updateIngredients: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        ingredients: recipeIngredientsSchema.shape.ingredients,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { ingredients, recipeId } = input;

      // Delete existing ingredients for the recipe
      await ctx.db.ingredient.deleteMany({
        where: { recipeId },
      });

      // Create new ingredients
      await ctx.db.ingredient.createMany({
        data: ingredients.map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          order: ingredient.order,
          recipeId,
        })),
      });

      return { success: true };
    }),

  updateSteps: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        steps: z
          .array(
            z.object({
              description: z
                .string()
                .trim()
                .min(1, "Step description is required"),
              order: z.int(),
              imageUrl: z
                .url("Step image URL must be a valid URL")
                .trim()
                .nullable(),
            }),
          )
          .min(1, "At least one step is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { steps, recipeId } = input;

      const currentSteps = await ctx.db.step.findMany({
        where: { recipeId },
      });

      for (const step of currentSteps) {
        if (step.imageUrl) {
          await deleteImageByUrl(step.imageUrl);
        }
      }

      // Delete existing steps for the recipe
      await ctx.db.step.deleteMany({
        where: { recipeId },
      });

      // Create new steps
      await ctx.db.step.createMany({
        data: steps.map((step) => ({
          description: step.description,
          imageUrl: step.imageUrl,
          order: step.order,
          recipeId,
        })),
      });

      return { success: true };
    }),

  tooglePublicationStatus: protectedProcedure
    .input(z.object({ recipeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.recipeId },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      const updatedRecipe = await ctx.db.recipe.update({
        where: { id: input.recipeId },
        data: { published: !recipe.published },
      });

      return updatedRecipe;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }): Promise<RecipeDto> => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { slug: input.slug },
        include: {
          ingredients: {
            orderBy: { order: "asc" },
          },
          steps: {
            orderBy: { order: "asc" },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      return {
        ...recipe,
        ingredients: recipe.ingredients.map((ingredient) => ({
          ...ingredient,
          quantity: ingredient.quantity.toString(),
        })),
      };
    }),

  getPublicationStatus: publicProcedure
    .input(z.object({ recipeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.recipeId },
        select: { published: true },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      return { published: recipe.published };
    }),

  getAll: publicProcedure
    .input(
      z.object({
        authorId: z.string().optional(),
        orderBy: z.enum(["createdAt", "likesCount"]).optional(),
        category: z.enum(Category).optional(),
        difficulty: z.enum(Difficulty).optional(),
        search: z.string().optional(),
        skip: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        authorId,
        orderBy = "createdAt",
        category,
        difficulty,
        search,
        skip,
      } = input;

      const take = 3;

      const whereClause: Prisma.RecipeWhereInput = {};

      if (authorId) {
        whereClause.authorId = authorId;
      } else {
        whereClause.published = true;
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      } else {
        if (category) {
          whereClause.category = category;
        }
        if (difficulty) {
          whereClause.difficulty = difficulty;
        }
      }

      const recipes = await ctx.db.recipe.findMany({
        where: whereClause,
        include: {
          ingredients: {
            orderBy: { order: "asc" },
          },
          steps: {
            orderBy: { order: "asc" },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        skip,
        take,
        orderBy: { [orderBy]: "desc" },
      });

      const recipesWithStringQuantities = recipes.map((recipe) => ({
        ...recipe,
        ingredients: recipe.ingredients.map((ingredient) => ({
          ...ingredient,
          quantity: ingredient.quantity.toString(),
        })),
      }));

      const total = await ctx.db.recipe.count({ where: whereClause });

      return {
        recipes: recipesWithStringQuantities,
        total,
        skip,
        take,
        hasNextPage: skip + take < total,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const recipe = await ctx.db.recipe.findUnique({
        where: { id },
        include: {
          steps: true,
        },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      if (recipe.imageUrl) {
        console.log("Deleting recipe image:", recipe.imageUrl);
        await deleteImageByUrl(recipe.imageUrl);
      }

      for (const step of recipe.steps) {
        if (step.imageUrl) {
          await deleteImageByUrl(step.imageUrl);
        }
      }

      await ctx.db.recipe.delete({
        where: { id },
      });

      return { success: true };
    }),
});
