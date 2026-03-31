import { RecipeIngredientsForm } from "~/components/recipe-ingredients-form";
import { TabsRecipeForm } from "~/components/tabs-recipe-form";
import { api } from "~/trpc/server";

export default async function UpdateRecipeIngredientsPage({
  params,
}: {
  params: Promise<{ recipeSlug: string }>;
}) {
  const { recipeSlug } = await params;

  const recipe = await api.recipes.getBySlug({
    slug: recipeSlug,
  });

  return (
    <TabsRecipeForm
      formType="update"
      step="ingredients"
      recipeSlug={recipeSlug}
    >
      <RecipeIngredientsForm recipe={recipe} />
    </TabsRecipeForm>
  );
}
