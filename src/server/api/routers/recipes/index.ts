import { Category, Difficulty, Unit } from "generated/prisma/enums";
import slugify from "slugify";
import z from "zod";
import { DEFAULT_LOCALE, LOCALES, toLocale } from "~/lib/locales";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_LIMIT,
  searchRecipes,
} from "~/server/rag/search";
import { removeRecipeIndex, syncRecipeIndex } from "~/server/rag/sync";
import { generateRecipeTranslations } from "~/server/translations/generate";
import {
  recipeWithTranslationsInclude,
  toRecipeDto,
} from "~/server/translations/resolve";
import { readSourceContent } from "~/server/translations/source";
import { replaceRecipeTranslations } from "~/server/translations/store";
import type { RecipeTranslationContent } from "~/server/translations/types";
import type { RecipeDto } from "~/types/recipe";
import { deleteImageByUrl } from "../images/service";
import { recipeIngredientsSchema, recipeSchema } from "./validation";
import type { Prisma } from "generated/prisma/client";

const reservedSlugs = ["new"];

const optionalLocaleSchema = z.enum(LOCALES).optional();

/** `"source"` resolves to the language the author wrote the recipe in. Used when editing. */
const sourceOrLocaleSchema = z
  .union([z.enum(LOCALES), z.literal("source")])
  .optional();

const PLACEHOLDER_INGREDIENT = "New ingredient";
const PLACEHOLDER_STEP = "New step";

function buildSlug(title: string): string {
  return slugify(title, {
    replacement: "-",
    lower: true,
    strict: true,
    trim: true,
  });
}

export const recipesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      recipeSchema
        .extend({
          imageUrl: z.url().trim().nullable(),
          locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
        })
        .omit({ image: true, tags: true }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = buildSlug(input.title);

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

      // The source text is written now; the other locales are generated once the ingredients
      // and steps are set, so `create` does not pay for a translation that is about to change.
      const sourceContent: RecipeTranslationContent = {
        title: input.title,
        description: input.description,
        ingredients: [{ order: 0, name: PLACEHOLDER_INGREDIENT }],
        steps: [{ order: 0, description: PLACEHOLDER_STEP }],
      };

      const newRecipe = await ctx.db.$transaction(async (tx) => {
        const recipe = await tx.recipe.create({
          data: {
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
            sourceLocale: input.locale,
            ingredients: {
              create: { quantity: "0", unit: Unit.GRAM, order: 0 },
            },
            steps: { create: { order: 0 } },
            author: { connect: { id: ctx.session.user.id } },
          },
        });

        await replaceRecipeTranslations(
          recipe.id,
          { [input.locale]: sourceContent },
          tx,
        );

        return recipe;
      });

      await syncRecipeIndex(newRecipe.id);

      return newRecipe;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        // Optional: when present, this is the language the submitted text is treated as being
        // written in. Omit it to keep the recipe's current source language.
        sourceLocale: z.enum(LOCALES).optional(),
        recipe: recipeSchema
          .extend({
            imageUrl: z.url().trim().nullable(),
          })
          .omit({ image: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, recipe, sourceLocale } = input;

      const slug = buildSlug(recipe.title);

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

      const source = await readSourceContent(id);

      if (!source) {
        throw new Error("Recipe translation not found");
      }

      // The submitted text is authoritative in `sourceLocale`: changing the source language
      // re-labels the text and regenerates every other locale from it.
      const nextSourceLocale = sourceLocale ?? source.sourceLocale;

      const translations = await generateRecipeTranslations({
        sourceLocale: nextSourceLocale,
        content: {
          ...source.content,
          title: recipe.title,
          description: recipe.description,
        },
      });

      const updatedRecipe = await ctx.db.$transaction(async (tx) => {
        const updated = await tx.recipe.update({
          where: { id },
          data: {
            category: recipe.category,
            difficulty: recipe.difficulty,
            slug,
            imageUrl: recipe.imageUrl,
            sourceLocale: nextSourceLocale,
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

        await replaceRecipeTranslations(id, translations, tx);

        return updated;
      });

      if (
        currentRecipe.imageUrl &&
        currentRecipe.imageUrl !== recipe.imageUrl
      ) {
        await deleteImageByUrl(currentRecipe.imageUrl);
      }

      await syncRecipeIndex(updatedRecipe.id);

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

      const source = await readSourceContent(recipeId);

      if (!source) {
        throw new Error("Recipe translation not found");
      }

      const translations = await generateRecipeTranslations({
        sourceLocale: source.sourceLocale,
        content: {
          ...source.content,
          ingredients: ingredients.map((ingredient) => ({
            order: ingredient.order,
            name: ingredient.name,
          })),
        },
      });

      await ctx.db.$transaction(async (tx) => {
        await tx.ingredient.deleteMany({ where: { recipeId } });

        await tx.ingredient.createMany({
          data: ingredients.map((ingredient) => ({
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            order: ingredient.order,
            recipeId,
          })),
        });

        await replaceRecipeTranslations(recipeId, translations, tx);
      });

      await syncRecipeIndex(recipeId);

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

      const source = await readSourceContent(recipeId);

      if (!source) {
        throw new Error("Recipe translation not found");
      }

      const translations = await generateRecipeTranslations({
        sourceLocale: source.sourceLocale,
        content: {
          ...source.content,
          steps: steps.map((step) => ({
            order: step.order,
            description: step.description,
          })),
        },
      });

      const currentSteps = await ctx.db.step.findMany({
        where: { recipeId },
      });

      for (const step of currentSteps) {
        if (step.imageUrl) {
          await deleteImageByUrl(step.imageUrl);
        }
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.step.deleteMany({ where: { recipeId } });

        await tx.step.createMany({
          data: steps.map((step) => ({
            imageUrl: step.imageUrl,
            order: step.order,
            recipeId,
          })),
        });

        await replaceRecipeTranslations(recipeId, translations, tx);
      });

      await syncRecipeIndex(recipeId);

      return { success: true };
    }),

  updateTags: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { recipeId, tags } = input;

      await ctx.db.recipeTag.deleteMany({
        where: { recipeId },
      });

      const uniqueTags = Array.from(new Set(tags));

      for (const tagName of uniqueTags) {
        const slug = buildSlug(tagName);

        let tag = await ctx.db.tag.findUnique({
          where: { slug: slug },
        });

        if (!tag) {
          tag = await ctx.db.tag.create({
            data: {
              name: tagName,
              slug,
            },
          });
        }

        await ctx.db.recipeTag.create({
          data: {
            recipeId,
            tagId: tag.id,
          },
        });
      }

      await syncRecipeIndex(recipeId);

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

      await syncRecipeIndex(updatedRecipe.id);

      return updatedRecipe;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string(), locale: sourceOrLocaleSchema }))
    .query(async ({ ctx, input }): Promise<RecipeDto> => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { slug: input.slug },
        include: recipeWithTranslationsInclude,
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      const locale =
        input.locale === "source"
          ? toLocale(recipe.sourceLocale)
          : toLocale(input.locale);

      return toRecipeDto(recipe, locale);
    }),

  getOne: publicProcedure
    .input(z.object({ id: z.string(), locale: sourceOrLocaleSchema }))
    .query(async ({ ctx, input }): Promise<RecipeDto> => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.id },
        include: recipeWithTranslationsInclude,
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      const locale =
        input.locale === "source"
          ? toLocale(recipe.sourceLocale)
          : toLocale(input.locale);

      return toRecipeDto(recipe, locale);
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
        cookbookId: z.string().optional(),
        orderBy: z.enum(["createdAt", "likesCount"]).optional(),
        category: z.enum(Category).optional(),
        difficulty: z.enum(Difficulty).optional(),
        search: z.string().optional(),
        locale: optionalLocaleSchema,
        /**
         * Adds the caller's own unpublished recipes to a public listing, so a draft can be
         * planned without publishing it first.
         */
        includeOwnUnpublished: z.boolean().optional(),
        skip: z.number(),
        take: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        authorId,
        cookbookId,
        orderBy = "createdAt",
        category,
        difficulty,
        search,
        locale,
        includeOwnUnpublished,
        skip,
        take = 15,
      } = input;

      const resolvedLocale = toLocale(locale);

      const whereClause: Prisma.RecipeWhereInput = {};

      if (authorId) {
        whereClause.authorId = authorId;
      } else if (!cookbookId) {
        if (includeOwnUnpublished && ctx.session?.user) {
          // Everything published, plus whatever the caller wrote themselves. Kept in `AND` so it
          // combines with the search conditions instead of replacing them.
          whereClause.AND = [
            {
              OR: [{ published: true }, { authorId: ctx.session.user.id }],
            },
          ];
        } else {
          whereClause.published = true;
        }
      }

      if (cookbookId) {
        whereClause.cookbooks = {
          some: {
            cookbookId,
          },
        };
      }

      if (search) {
        // Search every locale so a recipe is found no matter which language the user types in
        // ("peruano" and "peruvian" both match). Matching `some` returns each recipe once, even
        // when several translations match, so there are no duplicates.
        whereClause.OR = [
          {
            translations: {
              some: {
                title: { contains: search, mode: "insensitive" },
              },
            },
          },
          {
            translations: {
              some: {
                description: { contains: search, mode: "insensitive" },
              },
            },
          },
          {
            tags: {
              some: {
                tag: { name: { contains: search, mode: "insensitive" } },
              },
            },
          },
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
        include: recipeWithTranslationsInclude,
        skip,
        take,
        orderBy: { [orderBy]: "desc" },
      });

      const total = await ctx.db.recipe.count({ where: whereClause });

      return {
        recipes: recipes.map((recipe) => toRecipeDto(recipe, resolvedLocale)),
        total,
        skip,
        take,
        hasNextPage: skip + take < total,
      };
    }),

  /**
   * Semantic recipe retrieval used ONLY by the AI agent. It returns the matching record ids
   * and their similarity; the agent's search tool hydrates them from Postgres afterwards.
   * It does not reuse any of the server's listing procedures.
   *
   * There is a single mode: vector search. Pagination is done through `excludeIds` so
   * "show me more" returns the next best distinct results.
   *
   * Scope "mine" always filters by the authenticated user, never by a client-provided id.
   */
  semanticSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(1),
        scope: z.enum(["all", "mine"]).default("all"),
        maxTotalTime: z.int().positive().optional(),
        excludeIds: z.array(z.string()).optional(),
        take: z
          .int()
          .min(1)
          .max(MAX_SEARCH_LIMIT)
          .default(DEFAULT_SEARCH_LIMIT),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await searchRecipes({
        queryText: input.query,
        scope: input.scope,
        userId: ctx.session.user.id,
        filters: { maxTotalTime: input.maxTotalTime },
        excludeIds: input.excludeIds,
        limit: input.take,
      });

      return {
        matches: result.matches,
        hasMore: result.hasMore,
      };
    }),

  /**
   * All favourite recipes of the authenticated user, with their full data.
   *
   * Favourites are likes, which change per user and are not part of the vector index, so
   * this stays a deterministic database query. It returns the complete recipes so it can
   * back the favourites page; the AI agent adapts this output in its own tool.
   */
  getFavourites: protectedProcedure
    .input(z.object({ locale: optionalLocaleSchema }).optional())
    .query(async ({ ctx, input }) => {
      const recipes = await ctx.db.recipe.findMany({
        where: {
          likes: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: recipeWithTranslationsInclude,
        orderBy: { createdAt: "desc" },
      });

      const resolvedLocale = toLocale(input?.locale);

      return recipes.map((recipe) => toRecipeDto(recipe, resolvedLocale));
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

      await removeRecipeIndex(id);

      return { success: true };
    }),
});
