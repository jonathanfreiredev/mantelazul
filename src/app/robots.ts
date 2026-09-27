import type { MetadataRoute } from "next";
import { absoluteUrl } from "~/lib/seo/site";

/**
 * Paths that only exist for a signed-in user. They are kept out of the crawl entirely: every one
 * of them redirects anonymous visitors home, and none of them is linked from a public page.
 *
 * The sign-in pages are deliberately missing: a crawler has to be able to read their `noindex`
 * for it to mean anything, and a disallowed URL can still be indexed from links alone.
 */
const PRIVATE_PATHS = [
  "/api/",
  "/*/profile",
  "/*/household",
  "/*/calendar",
  "/*/cookbooks",
  "/*/recipes/new",
  "/*/recipes/*/update",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
