import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { toLocale } from "~/lib/locales";
import { Recipe } from "~/components/recipe-page/recipe";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

interface RecipePageProps {
  params: Promise<{ recipeSlug: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const [{ recipeSlug }, session, locale] = await Promise.all([
    params,
    getSession(),
    getLocale(),
  ]);

  const recipe = await api.recipes.getBySlug({
    slug: recipeSlug,
    locale: toLocale(locale),
  });

  if (
    !recipe ||
    (!recipe.published && !session) ||
    (!recipe.published && session?.user.id !== recipe.authorId)
  ) {
    notFound();
  }

  return (
    <HydrateClient>
      <Recipe slug={recipeSlug} />
    </HydrateClient>
  );
}
