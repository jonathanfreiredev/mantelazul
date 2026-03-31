import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { cookbookSchema } from "./validation";
import type { CookbookDto } from "~/types/cookbook";

export const cookbooksRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }): Promise<CookbookDto[]> => {
    const cookbooks = await ctx.db.cookbook.findMany({
      where: {
        authorId: ctx.session?.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const cookbooksWithImages = await Promise.all(
      cookbooks.map(async (cookbook) => {
        const recipes = await ctx.db.cookbookRecipe.findMany({
          where: {
            cookbookId: cookbook.id,
            recipe: {
              imageUrl: { not: null },
            },
          },
          take: 3,
          include: {
            recipe: true,
          },
        });

        return {
          ...cookbook,
          images: recipes
            .map((r) => r.recipe.imageUrl)
            .filter((url): url is string => !!url),
        };
      }),
    );

    return cookbooksWithImages;
  }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<CookbookDto> => {
      const cookbook = await ctx.db.cookbook.findFirst({
        where: {
          id: input.id,
          authorId: ctx.session?.user.id,
        },
      });

      if (!cookbook) {
        throw new Error("Cookbook not found");
      }

      const recipes = await ctx.db.cookbookRecipe.findMany({
        where: {
          cookbookId: cookbook.id,
          recipe: {
            imageUrl: { not: null },
          },
        },
        take: 3,
        include: {
          recipe: true,
        },
      });

      return {
        ...cookbook,
        images: recipes
          .map((r) => r.recipe.imageUrl)
          .filter((url): url is string => !!url),
      };
    }),

  create: protectedProcedure
    .input(cookbookSchema)
    .mutation(async ({ ctx, input }) => {
      const cookbook = await ctx.db.cookbook.create({
        data: {
          name: input.name,
          authorId: ctx.session?.user.id,
        },
      });

      return cookbook;
    }),

  getAllCookbooksByRecipeId: protectedProcedure
    .input(z.object({ recipeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const cookbooks = await ctx.db.cookbook.findMany({
        where: {
          authorId: ctx.session?.user.id,
        },
      });

      const cookbooksWithRecipe = await Promise.all(
        cookbooks.map(async (cookbook) => {
          const cookbookRecipe = await ctx.db.cookbookRecipe.findFirst({
            where: {
              cookbookId: cookbook.id,
              recipeId: input.recipeId,
            },
          });

          return {
            ...cookbook,
            hasRecipe: !!cookbookRecipe,
          };
        }),
      );

      return cookbooksWithRecipe;
    }),

  toogleRecipe: protectedProcedure
    .input(
      z.object({
        cookbookId: z.string(),
        recipeId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingEntry = await ctx.db.cookbookRecipe.findFirst({
        where: {
          cookbookId: input.cookbookId,
          recipeId: input.recipeId,
        },
      });

      if (existingEntry) {
        await ctx.db.cookbookRecipe.delete({
          where: {
            cookbookId_recipeId: {
              cookbookId: input.cookbookId,
              recipeId: input.recipeId,
            },
          },
        });
      } else {
        await ctx.db.cookbookRecipe.create({
          data: {
            cookbookId: input.cookbookId,
            recipeId: input.recipeId,
          },
        });
      }

      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.cookbook.update({
        where: {
          id: input.id,
          authorId: ctx.session?.user.id,
        },
        data: {
          name: input.name,
        },
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cookbook = await ctx.db.cookbook.deleteMany({
        where: {
          id: input.id,
          authorId: ctx.session?.user.id,
        },
      });

      return { success: true };
    }),
});
