import type { Unit } from "generated/prisma/enums";

/**
 * Display labels for the `Unit` enum.
 *
 * The enum values are stored in full ("MILLILITER") because they are API and database values,
 * but they are too long for the UI: an ingredient list reads better as "180 g" than "180 gram".
 * Recipe units are conventionally written without a trailing period and never pluralized.
 */
export const UNIT_LABELS: Record<Unit, string> = {
  GRAM: "g",
  KILOGRAM: "kg",
  LITER: "l",
  MILLILITER: "ml",
  CUP: "cup",
  TABLESPOON: "tbsp",
  TEASPOON: "tsp",
  UNIT: "unit",
};

/** Abbreviated, display-ready label for a unit (e.g. "GRAM" -> "g"). */
export function formatUnit(unit: Unit): string {
  return UNIT_LABELS[unit];
}
