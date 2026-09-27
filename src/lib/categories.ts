import { Category } from "generated/prisma/enums";

/**
 * The public category pages, keyed by their path segment.
 *
 * `categories-list.ts` is the same list for the UI (it carries the names, images and descriptions
 * the navbar and the home page render); this is the routing side of it, so a page, a sitemap and
 * a breadcrumb can all agree on which paths exist.
 */
export const CATEGORY_BY_PATH = {
  mains: Category.MAIN_COURSE,
  starters: Category.STARTER,
  desserts: Category.DESSERT,
  drinks: Category.DRINK,
  snacks: Category.SNACK,
  breakfast: Category.BREAKFAST,
  everything: undefined,
} as const satisfies Record<string, Category | undefined>;

export type CategoryPath = keyof typeof CATEGORY_BY_PATH;

export const CATEGORY_PATHS = Object.keys(CATEGORY_BY_PATH) as CategoryPath[];

/** Narrows a path segment from the URL to one of the pages that actually exist. */
export function isCategoryPath(value: string): value is CategoryPath {
  return value in CATEGORY_BY_PATH;
}

/** Path of the page that lists a category, or null for one that has no page of its own. */
export function categoryPathFor(category: Category): string | null {
  const entry = Object.entries(CATEGORY_BY_PATH).find(
    ([, value]) => value === category,
  );

  return entry ? `/${entry[0]}` : null;
}
