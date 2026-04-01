import { TabsRecipeForm } from "~/components/recipes/tabs-recipe-form";
import { UpdateRecipeForm } from "~/components/recipes/update-recipe-form";
import { api } from "~/trpc/server";

export default async function UpdateRecipePage({
  params,
}: {
  params: Promise<{ recipeSlug: string }>;
}) {
  const { recipeSlug } = await params;

  const recipe = await api.recipes.getBySlug({
    slug: recipeSlug,
  });

  return (
    <TabsRecipeForm formType="update" step="details" recipeSlug={recipeSlug}>
      <UpdateRecipeForm recipe={recipe} />
    </TabsRecipeForm>
  );
}
