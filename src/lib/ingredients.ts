import { Unit } from "generated/prisma/enums";
import type { Locale } from "./locales";
import { formatUnit } from "./units";
import { formatQuantity } from "./utils";

/**
 * The quantity an ingredient carries when it has no amount of its own: salt, pepper and anything
 * else that goes "to taste".
 *
 * Zero is not a real amount in a kitchen, so it doubles as the marker for "no amount" and
 * `Ingredient.quantity` can stay NOT NULL. The trade-off is that the type system no longer
 * forces callers to handle the case, so every place that renders an amount goes through
 * `formatIngredientAmount` instead of reading the column directly.
 */
export const NO_AMOUNT = "0";

/** Whether an ingredient carries a real amount, i.e. is not one that goes "to taste". */
export function hasAmount(quantity: number | string): boolean {
  const value =
    typeof quantity === "number" ? quantity : Number.parseFloat(quantity);

  return Number.isFinite(value) && value !== 0;
}

/**
 * An amount as the recipe page writes it: `"180 g"`, or just `"2"` for countable things, since
 * the ingredient name already says what they are ("2 tomates" reads better than "2 unidad
 * tomates").
 *
 * Returns null when there is no amount, so every caller falls back to showing the name alone.
 */
export function formatIngredientAmount(
  quantity: number | string,
  unit: Unit,
  locale: Locale,
): string | null {
  if (!hasAmount(quantity)) return null;

  const value = formatQuantity(
    typeof quantity === "number" ? quantity : Number.parseFloat(quantity),
  );

  return unit === Unit.UNIT ? value : `${value} ${formatUnit(unit, locale)}`;
}

/**
 * Renders an ingredient the way every part of the app should: the amount and the name, or just
 * the name when there is no amount.
 */
export function formatIngredient(
  quantity: number | string,
  unit: Unit,
  name: string,
  locale: Locale,
): string {
  const amount = formatIngredientAmount(quantity, unit, locale);

  return amount ? `${amount} ${name}` : name;
}
