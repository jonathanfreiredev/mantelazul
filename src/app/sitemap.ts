import type { MetadataRoute } from "next";
import { CATEGORY_PATHS } from "~/lib/categories";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "~/lib/locales";
import { localizedUrl } from "~/lib/seo/site";
import { getPublishedRecipesSeo } from "~/server/seo/recipes";

/**
 * The sitemap is rebuilt every hour so a recipe published from the app reaches search engines
 * without waiting for the next deploy. Every entry carries the full hreflang set, which is how a
 * crawler learns that the language versions are one page and not duplicates.
 */
export const revalidate = 3600;

interface SitemapPage {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  /** Languages the page exists in. Defaults to every language of the app. */
  locales?: Locale[];
  lastModified?: Date;
  imageUrl?: string | null;
}

/** Pages that are public in every language: the home page, the categories and the legal pages. */
const STATIC_PAGES: SitemapPage[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  ...CATEGORY_PATHS.map((category) => ({
    path: `/${category}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  })),
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

function localizedEntries(page: SitemapPage): MetadataRoute.Sitemap {
  const locales = page.locales?.length ? page.locales : LOCALES;
  const fallbackLocale = locales.includes(DEFAULT_LOCALE)
    ? DEFAULT_LOCALE
    : locales[0]!;

  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = localizedUrl(locale, page.path);
  }
  languages["x-default"] = localizedUrl(fallbackLocale, page.path);

  return locales.map((locale) => ({
    url: localizedUrl(locale, page.path),
    lastModified: page.lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    alternates: { languages },
    images: page.imageUrl ? [page.imageUrl] : undefined,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recipes = await getPublishedRecipesSeo();

  const pages: SitemapPage[] = [
    ...STATIC_PAGES,
    ...recipes.map((recipe) => ({
      path: `/recipes/${recipe.slug}`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
      locales: recipe.locales,
      lastModified: recipe.updatedAt,
      imageUrl: recipe.imageUrl,
    })),
  ];

  return pages.flatMap(localizedEntries);
}
