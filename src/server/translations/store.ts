import type { Prisma } from "generated/prisma/client";
import { LOCALES } from "~/lib/locales";
import { db } from "~/server/db";
import type { RecipeTranslationContent, RecipeTranslations } from "./types";

type PrismaClientLike = Prisma.TransactionClient | typeof db;

function toRow(content: RecipeTranslationContent) {
  return {
    title: content.title,
    description: content.description,
    ingredients: content.ingredients as unknown as Prisma.InputJsonValue,
    steps: content.steps as unknown as Prisma.InputJsonValue,
  };
}

/**
 * Writes every locale of a recipe, removing any locale that is no longer present.
 *
 * Accepts a client so it can take part in the same transaction as the structural writes.
 */
export async function replaceRecipeTranslations(
  recipeId: string,
  translations: RecipeTranslations,
  client: PrismaClientLike = db,
): Promise<void> {
  const locales = LOCALES.filter(
    (locale) => translations[locale] !== undefined,
  );

  await client.recipeTranslation.deleteMany({
    where: { recipeId, locale: { notIn: [...locales] } },
  });

  for (const locale of locales) {
    const content = translations[locale]!;
    await client.recipeTranslation.upsert({
      where: { recipeId_locale: { recipeId, locale } },
      create: { recipeId, locale, ...toRow(content) },
      update: toRow(content),
    });
  }
}
