import { notFound } from "next/navigation";
import { Recipe } from "~/components/recipe-page/recipe";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

interface RecipePageProps {
  params: Promise<{ recipeSlug: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const [{ recipeSlug }, session] = await Promise.all([params, getSession()]);

  const recipe = await api.recipes.getBySlug({
    slug: recipeSlug,
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
