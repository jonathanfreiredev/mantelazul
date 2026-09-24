import { notFound, redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

export default async function UpdateRecipeLayout({
  params,
  children,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ recipeSlug: string }>;
}>) {
  const [{ recipeSlug }, session] = await Promise.all([
    await params,
    getSession(),
  ]);

  const isLoggedIn = !!session?.session;

  if (!isLoggedIn) {
    redirect("/");
  }

  const recipe = await api.recipes.getBySlug({
    slug: recipeSlug,
    locale: "source",
  });

  if (!recipe) {
    notFound();
  }

  if (recipe.authorId !== session.user.id) {
    notFound();
  }

  return <>{children}</>;
}
