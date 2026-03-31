import { RecipeTagsForm } from "~/components/recipe-tags-form";
import { TabsRecipeForm } from "~/components/tabs-recipe-form";
import { api, HydrateClient } from "~/trpc/server";

export default async function UpdateRecipeTagsPage({
  params,
}: {
  params: Promise<{ recipeSlug: string }>;
}) {
  const { recipeSlug } = await params;

  const recipe = await api.recipes.getBySlug({
    slug: recipeSlug,
  });

  void api.tags.getAll.prefetch();

  return (
    <HydrateClient>
      <TabsRecipeForm formType="update" step="tags" recipeSlug={recipeSlug}>
        <RecipeTagsForm recipe={recipe} />
      </TabsRecipeForm>
    </HydrateClient>
  );
}
