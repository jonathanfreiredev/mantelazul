import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "~/lib/locales";
import { SITE_NAME, localizedUrl } from "./site";

/**
 * `og:locale` wants a language and a territory, which the app's bare locale codes do not carry.
 * The territory is the one the content is written for.
 */
const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
};

/**
 * The card `app/[locale]/opengraph-image.tsx` draws. Pages that set their own Open Graph block
 * replace the one the file convention contributes, so the fallback has to be named here.
 */
const SOCIAL_IMAGE_PATH = "/opengraph-image";
const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };

interface PageMetadataOptions {
  title: Metadata["title"];
  description: string;
  /** Path without the language prefix, e.g. `/recipes/risotto-de-azafran`. */
  path: string;
  /** Language the page is being rendered in. */
  locale: Locale;
  /** Languages the page really exists in. Defaults to every language of the app. */
  locales?: readonly Locale[];
  /** Cover image. Without one the site-wide Open Graph image is used. */
  imageUrl?: string | null;
}

/**
 * The title a social card should show. A page that sets an absolute title keeps it, because the
 * layout template would otherwise repeat the site name inside the card.
 */
function socialTitleOf(title: Metadata["title"]): string {
  if (typeof title === "string") return title;
  if (!title) return SITE_NAME;
  if ("absolute" in title) return title.absolute;
  if ("default" in title) return title.default;

  return SITE_NAME;
}

/**
 * Metadata shared by every page search engines may index: canonical, hreflang, Open Graph and
 * Twitter.
 *
 * Open Graph is rebuilt here instead of inherited from the layout because Next replaces the whole
 * object as soon as a page sets one, and a page that sets a title but no `og:title` shares badly.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  locale,
  locales = LOCALES,
  imageUrl,
}: PageMetadataOptions): Metadata {
  const available = locales.length > 0 ? locales : [DEFAULT_LOCALE];

  // A page rendered in a language it has no translation for shows a fallback, so it must point
  // its canonical at the language the text really came from.
  const canonicalLocale = available.includes(locale) ? locale : available[0]!;
  const canonical = localizedUrl(canonicalLocale, path);

  const languages: Record<string, string> = {};
  for (const availableLocale of available) {
    languages[availableLocale] = localizedUrl(availableLocale, path);
  }

  // Which language to serve a visitor whose own language is none of the above.
  const fallbackLocale = available.includes(DEFAULT_LOCALE)
    ? DEFAULT_LOCALE
    : available[0]!;
  languages["x-default"] = localizedUrl(fallbackLocale, path);

  const socialTitle = socialTitleOf(title);
  const socialImage = imageUrl
    ? { url: imageUrl, alt: socialTitle }
    : {
        url: localizedUrl(locale, SOCIAL_IMAGE_PATH),
        ...SOCIAL_IMAGE_SIZE,
        alt: SITE_NAME,
      };

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: canonical,
      locale: OG_LOCALES[canonicalLocale],
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage.url],
    },
  };
}

/**
 * Metadata for the pages that only exist behind a session.
 *
 * `noindex` is the directive that actually keeps a page out of the index: a `robots.txt` rule
 * only stops the crawl, and a disallowed URL can still be indexed from links alone. Pages that
 * are not linked publicly are kept out of the crawl separately, in `robots.ts`.
 */
export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
