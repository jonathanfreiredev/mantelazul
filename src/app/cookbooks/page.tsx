import Link from "next/link";
import { redirect } from "next/navigation";
import { Cookbooks } from "~/components/cookbooks/cookbooks";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

export default async function CookbooksPage() {
  const session = await getSession();

  const isLoggedIn = !!session?.session;

  if (!isLoggedIn) {
    redirect("/");
  }

  void api.cookbooks.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="flex h-full w-full flex-col items-center py-6 md:py-10">
        <Tabs value="cookbooks">
          <TabsList className="py-4" variant="line">
            <TabsTrigger value="recipes" asChild>
              <Link href="/recipes">My recipes</Link>
            </TabsTrigger>
            <TabsTrigger value="cookbooks" asChild className="p-3 text-xl">
              <Link href="/cookbooks">My cookbooks</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Cookbooks />
      </div>
    </HydrateClient>
  );
}
