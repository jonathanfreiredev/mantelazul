import { env } from "~/env";
import type { Locale } from "~/lib/locales";

/**
 * Canonical origin of the site. Every absolute URL the SEO surface emits (canonicals, hreflang,
 * the sitemap, robots.txt and Open Graph) is built from it, so a preview deployment still points
 * search engines at production.
 */
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL;

export const SITE_NAME = "Mantel Azul";

/** Brand blue, sampled from the logo. Used by the manifest and the social card. */
export const BRAND_COLOR = "#0048a8";

/** Absolute URL of an app path: `/en/recipes/x` becomes `https://mantelazul.com/en/recipes/x`. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Path of a page in one language. The default language keeps its prefix: `/en` and `/es` are both
 * real, separately indexed URLs, which is what makes the hreflang cluster work.
 */
export function localizedPath(locale: Locale, path = "/"): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function localizedUrl(locale: Locale, path = "/"): string {
  return absoluteUrl(localizedPath(locale, path));
}
