import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CategoryHero } from "~/components/category-hero";
import { CategoriesNavbar } from "~/components/home/categories-navbar";
import { Recipes } from "~/components/recipes/recipes";
import { CATEGORY_BY_PATH, isCategoryPath } from "~/lib/categories";
import { toLocale } from "~/lib/locales";
import { buildPageMetadata } from "~/lib/seo/metadata";
import { api, HydrateClient } from "~/trpc/server";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const [{ category }, locale] = await Promise.all([params, getLocale()]);

  if (!isCategoryPath(category)) return {};

  const t = await getTranslations({ locale, namespace: "CategoryPages" });

  return buildPageMetadata({
    title: t(`${category}.name`),
    description: t(`${category}.description`),
    path: `/${category}`,
    locale: toLocale(locale),
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;

  // Anything else is not a page. Without this the segment swallows every unknown single-segment
  // path and answers with a copy of the full listing, which search engines would index over and
  // over as separate URLs.
  if (!isCategoryPath(category)) notFound();

  const locale = await getLocale();

  // Awaited rather than fired and forgotten: the list has to be in the query cache before the
  // page renders, or the HTML arrives empty and a crawler that does not run JavaScript sees
  // nothing at all.
  await api.recipes.getAll.prefetch({
    category: CATEGORY_BY_PATH[category],
    orderBy: "createdAt",
    skip: 0,
    locale: toLocale(locale),
  });

  return (
    <HydrateClient>
      <CategoriesNavbar currentCategory={category} />
      <CategoryHero currentCategory={category} />

      <div className="flex w-full px-5 sm:px-10">
        <Recipes categoryPage={CATEGORY_BY_PATH[category]} isEditable={false} />
      </div>
    </HydrateClient>
  );
}
