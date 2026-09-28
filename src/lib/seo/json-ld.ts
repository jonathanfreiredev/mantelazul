import { categoryPathFor } from "~/lib/categories";
import { formatIngredient } from "~/lib/ingredients";
import type { Locale } from "~/lib/locales";
import type { RecipeDto } from "~/types/recipe";
import { SITE_NAME, localizedUrl } from "./site";

/**
 * Serializes structured data for a `<script type="application/ld+json">` tag.
 *
 * `<` is escaped because recipe titles and descriptions are free text: one containing `</script>`
 * would otherwise close the tag early and inject markup into the page.
 */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Minutes as the ISO 8601 duration schema.org expects. */
function isoDuration(minutes: number): string {
  return `PT${minutes}M`;
}

/** The site itself: name, description and canonical URL, for the home page. */
export function websiteJsonLd({
  locale,
  description,
}: {
  locale: Locale;
  description: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description,
    url: localizedUrl(locale),
    inLanguage: locale,
  };
}

export interface RecipeJsonLdInput {
  recipe: RecipeDto;
  locale: Locale;
  /** Name of the person who wrote it, or null for a recipe whose author deleted their account. */
  authorName: string | null;
  /** Localized label for the category, which is an enum in the database. */
  categoryLabel: string;
}

/**
 * The recipe as schema.org, which is what turns a search result into a rich one: photo, cooking
 * times, ingredients and nutrition. Every value comes from the recipe itself, so the markup can
 * never disagree with the page.
 */
export function recipeJsonLd({
  recipe,
  locale,
  authorName,
  categoryLabel,
}: RecipeJsonLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description || undefined,
    url: localizedUrl(locale, `/recipes/${recipe.slug}`),
    inLanguage: locale,
    image: recipe.imageUrl ? [recipe.imageUrl] : undefined,
    datePublished: recipe.createdAt.toISOString(),
    dateModified: recipe.updatedAt.toISOString(),
    prepTime: isoDuration(recipe.preparationTime),
    cookTime: isoDuration(recipe.cookingTime),
    totalTime: isoDuration(
      recipe.preparationTime + recipe.cookingTime + recipe.restingTime,
    ),
    recipeYield: String(recipe.defaultServings),
    recipeCategory: categoryLabel,
    keywords: recipe.tags.map(({ tag }) => tag.name).join(", "),
    author: {
      "@type": authorName ? "Person" : "Organization",
      name: authorName ?? SITE_NAME,
    },
    recipeIngredient: recipe.ingredients.map((ingredient) =>
      formatIngredient(
        ingredient.quantity,
        ingredient.unit,
        ingredient.name,
        locale,
      ),
    ),
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      text: step.description,
    })),
    nutrition: {
      "@type": "NutritionInformation",
      calories: `${recipe.calories} kcal`,
      carbohydrateContent: `${recipe.carbohydrates} g`,
      proteinContent: `${recipe.protein} g`,
      fatContent: `${recipe.fat} g`,
    },
  };
}

/** The trail search engines show above a result: home, the category, the recipe. */
export function breadcrumbJsonLd(
  items: { name: string; url?: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Path of the category page a recipe belongs to, for its breadcrumb. */
export function recipeBreadcrumbItems({
  recipe,
  locale,
  homeLabel,
  categoryLabel,
}: {
  recipe: RecipeDto;
  locale: Locale;
  homeLabel: string;
  categoryLabel: string;
}): { name: string; url?: string }[] {
  const categoryPath = categoryPathFor(recipe.category);

  return [
    { name: homeLabel, url: localizedUrl(locale) },
    ...(categoryPath
      ? [{ name: categoryLabel, url: localizedUrl(locale, categoryPath) }]
      : []),
    { name: recipe.title },
  ];
}
