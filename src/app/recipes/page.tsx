import Link from "next/link";
import { redirect } from "next/navigation";
import { Recipes } from "~/components/recipes/recipes";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

export default async function RecipesPage() {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (!isLoggedIn) {
    redirect("/");
  }

  void api.recipes.getAll.prefetch({
    authorId: session.user.id,
    orderBy: "createdAt",
    skip: 0,
  });

  return (
    <HydrateClient>
      <div className="flex h-full w-full flex-col items-center py-6 md:py-10">
        <Tabs value="recipes">
          <TabsList className="py-4" variant="line">
            <TabsTrigger value="recipes" asChild className="p-3 text-xl">
              <Link href="/recipes">My recipes</Link>
            </TabsTrigger>
            <TabsTrigger value="cookbooks" asChild>
              <Link href="/cookbooks">My cookbooks</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="default" className="mt-6">
          <Link href="/recipes/new">Create new recipe</Link>
        </Button>
        <div className="flex w-full px-5 sm:px-10">
          <Recipes authorId={session.user.id} isEditable />
        </div>
      </div>
    </HydrateClient>
  );
}
