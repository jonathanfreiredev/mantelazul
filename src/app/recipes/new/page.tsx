import { redirect } from "next/navigation";
import { CreateRecipeForm } from "~/components/recipes/create-recipe-form";
import { TabsRecipeForm } from "~/components/recipes/tabs-recipe-form";
import { getSession } from "~/server/better-auth/server";

export default async function NewRecipesPage() {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (!isLoggedIn) {
    redirect("/");
  }

  return (
    <TabsRecipeForm formType="create" step="details" recipeSlug="">
      <CreateRecipeForm />
    </TabsRecipeForm>
  );
}
