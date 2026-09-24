/**
 * The languages the app supports. English is the canonical language used for search and
 * embeddings; `sourceLocale` on a recipe tells which one the author actually wrote in.
 */
export const LOCALES = ["en", "es", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/** Narrows an arbitrary string (e.g. a database column) to a supported locale. */
export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
