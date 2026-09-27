import "server-only";

import type { Prisma } from "generated/prisma/client";
import { cache } from "react";
import { LOCALES, type Locale } from "~/lib/locales";
import { db } from "~/server/db";
import {
  recipeWithTranslationsInclude,
  toRecipeDto,
} from "~/server/translations/resolve";
import type { RecipeDto } from "~/types/recipe";

/**
 * The recipe plus its author's name. The author is not part of the recipe the UI renders, but
 * schema.org asks for it, and the alternative is a second query.
 */
const recipeSeoInclude = {
  ...recipeWithTranslationsInclude,
  author: { select: { name: true } },
} satisfies Prisma.RecipeInclude;

export interface RecipeSeo {
  recipe: RecipeDto;
  /** Languages the recipe has a real translation for, in the order the app declares them. */
  locales: Locale[];
  /** Display name of the author, or null when the account is gone. */
  authorName: string | null;
}

function availableLocales(translations: { locale: string }[]): Locale[] {
  return LOCALES.filter((locale) =>
    translations.some((row) => row.locale === locale),
  );
}

/**
 * Everything the head of a recipe page needs: the text to describe it, the languages it exists in
 * and who wrote it. Memoized because `generateMetadata` and the page itself both ask for the same
 * recipe in the same request.
 *
 * Returns null for a slug that matches nothing, so the caller can answer 404 instead of 500.
 */
export const getRecipeSeo = cache(
  async (slug: string, locale: Locale): Promise<RecipeSeo | null> => {
    const recipe = await db.recipe.findUnique({
      where: { slug },
      include: recipeSeoInclude,
    });

    if (!recipe) return null;

    return {
      recipe: toRecipeDto(recipe, locale),
      locales: availableLocales(recipe.translations),
      authorName: recipe.author?.name ?? null,
    };
  },
);

export interface PublishedRecipeSeo {
  slug: string;
  updatedAt: Date;
  imageUrl: string | null;
  locales: Locale[];
}

/**
 * Every published recipe, for the sitemap.
 *
 * Deliberately not memoized: the sitemap is the only caller and it runs outside a React render,
 * where `cache` has no request to attach to.
 */
export async function getPublishedRecipesSeo(): Promise<PublishedRecipeSeo[]> {
  const recipes = await db.recipe.findMany({
    where: { published: true },
    select: {
      slug: true,
      updatedAt: true,
      imageUrl: true,
      translations: { select: { locale: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return recipes.map((recipe) => ({
    slug: recipe.slug,
    updatedAt: recipe.updatedAt,
    imageUrl: recipe.imageUrl,
    locales: availableLocales(recipe.translations),
  }));
}
