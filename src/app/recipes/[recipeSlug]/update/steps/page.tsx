import { RecipeStepsForm } from "~/components/recipes/recipe-steps-form";
import { TabsRecipeForm } from "~/components/recipes/tabs-recipe-form";
import { api } from "~/trpc/server";

export default async function UpdateRecipeStepsPage({
  params,
}: {
  params: Promise<{ recipeSlug: string }>;
}) {
  const { recipeSlug } = await params;

  const recipe = await api.recipes.getBySlug({
    slug: recipeSlug,
  });

  return (
    <TabsRecipeForm formType="update" step="steps" recipeSlug={recipeSlug}>
      <RecipeStepsForm recipe={recipe} />
    </TabsRecipeForm>
  );
}
