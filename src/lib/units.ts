import type { Unit } from "generated/prisma/enums";
import { DEFAULT_LOCALE, type Locale } from "./locales";

/**
 * Display labels for the `Unit` enum, per language.
 *
 * The enum values are stored in full ("MILLILITER") because they are API and database values,
 * but they are too long for the UI: an ingredient list reads better as "180 g" than "180 gram".
 * Recipe units are conventionally written without a trailing period and never pluralized.
 * They live in code rather than in the message files because they are used on the server too
 * (the agent's recipe formatter), where loading the UI messages is not always possible.
 */
export const UNIT_LABELS: Record<Locale, Record<Unit, string>> = {
  en: {
    GRAM: "g",
    KILOGRAM: "kg",
    LITER: "l",
    MILLILITER: "ml",
    CUP: "cup",
    TABLESPOON: "tbsp",
    TEASPOON: "tsp",
    UNIT: "unit",
  },
  es: {
    GRAM: "g",
    KILOGRAM: "kg",
    LITER: "l",
    MILLILITER: "ml",
    CUP: "taza",
    TABLESPOON: "cda",
    TEASPOON: "cdta",
    UNIT: "unidad",
  },
  de: {
    GRAM: "g",
    KILOGRAM: "kg",
    LITER: "l",
    MILLILITER: "ml",
    CUP: "Tasse",
    TABLESPOON: "EL",
    TEASPOON: "TL",
    UNIT: "Stück",
  },
};

/** Abbreviated, display-ready label for a unit (e.g. "GRAM" -> "g"). */
export function formatUnit(unit: Unit, locale: Locale = DEFAULT_LOCALE): string {
  return UNIT_LABELS[locale][unit];
}
