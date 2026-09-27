import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Recipe } from "~/components/recipe-page/recipe";
import { JsonLd } from "~/components/seo/json-ld";
import { toLocale } from "~/lib/locales";
import {
  breadcrumbJsonLd,
  recipeBreadcrumbItems,
  recipeJsonLd,
} from "~/lib/seo/json-ld";
import { buildPageMetadata, PRIVATE_PAGE_METADATA } from "~/lib/seo/metadata";
import { getSession } from "~/server/better-auth/server";
import { getRecipeSeo } from "~/server/seo/recipes";
import { api, HydrateClient } from "~/trpc/server";

interface RecipePageProps {
  params: Promise<{ recipeSlug: string }>;
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const [{ recipeSlug }, locale] = await Promise.all([params, getLocale()]);
  const resolvedLocale = toLocale(locale);
  const seo = await getRecipeSeo(recipeSlug, resolvedLocale);

  // A slug that matches nothing is answered with a 404 by the page below, and a draft belongs to
  // its author alone: neither belongs in the index.
  if (!seo || !seo.recipe.published) return PRIVATE_PAGE_METADATA;

  const t = await getTranslations({ locale, namespace: "Metadata" });

  return buildPageMetadata({
    title: seo.recipe.title,
    description:
      seo.recipe.description ||
      t("recipeFallbackDescription", { title: seo.recipe.title }),
    path: `/recipes/${seo.recipe.slug}`,
    locale: resolvedLocale,
    locales: seo.locales,
    imageUrl: seo.recipe.imageUrl,
  });
}

export default async function RecipePage({ params }: RecipePageProps) {
  const [{ recipeSlug }, session, locale] = await Promise.all([
    params,
    getSession(),
    getLocale(),
  ]);
  const resolvedLocale = toLocale(locale);

  // Both run in parallel: the prefetch fills the cache the page renders from, and the other
  // tells us whether the recipe exists and whether this visitor is allowed to see it. Awaiting
  // the prefetch is what puts the ingredients in the HTML instead of leaving the page empty
  // until the browser has fetched them.
  const [seo] = await Promise.all([
    getRecipeSeo(recipeSlug, resolvedLocale),
    api.recipes.getBySlug.prefetch({
      slug: recipeSlug,
      locale: resolvedLocale,
    }),
  ]);

  if (
    !seo ||
    (!seo.recipe.published && session?.user.id !== seo.recipe.authorId)
  ) {
    notFound();
  }

  const [tCategories, tCategoryPages] = await Promise.all([
    getTranslations({ locale, namespace: "Categories" }),
    getTranslations({ locale, namespace: "CategoryPages" }),
  ]);

  const categoryLabel = tCategories(seo.recipe.category);

  return (
    <>
      {seo.recipe.published && (
        <>
          <JsonLd
            data={recipeJsonLd({
              recipe: seo.recipe,
              locale: resolvedLocale,
              authorName: seo.authorName,
              categoryLabel,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd(
              recipeBreadcrumbItems({
                recipe: seo.recipe,
                locale: resolvedLocale,
                // "Explore" is what the app calls the home page in its own navbar.
                homeLabel: tCategoryPages("explore.name"),
                categoryLabel,
              }),
            )}
          />
        </>
      )}

      <HydrateClient>
        <Recipe slug={recipeSlug} />
      </HydrateClient>
    </>
  );
}
