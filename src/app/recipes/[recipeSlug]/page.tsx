import { Recipe } from "~/components/recipe-page/recipe";
import { api, HydrateClient } from "~/trpc/server";

interface RecipePageProps {
  params: Promise<{ recipeSlug: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { recipeSlug } = await params;

  void api.recipes.getBySlug.prefetch({
    slug: recipeSlug,
  });

  return (
    <HydrateClient>
      <Recipe slug={recipeSlug} />
    </HydrateClient>
  );
}
