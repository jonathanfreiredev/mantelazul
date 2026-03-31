import { RecipeStepsForm } from "~/components/recipe-steps-form";
import { TabsRecipeForm } from "~/components/tabs-recipe-form";
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
