import z from "zod";

/**
 * How much of one ingredient a single step consumes, as `part/of` of the ingredient's own amount.
 *
 * Integers on purpose: "two thirds" is exact as 2/3 and inexact as 0.667, and neither the author
 * nor the model should have to divide anything to write a recipe down.
 */
export interface IngredientUsage {
  /** `order` of the ingredient row in the same recipe. */
  order: number;
  /** Numerator of the share this step consumes. Always between 1 and `of`. */
  part: number;
  /** Denominator of the share. 1 means the step uses the ingredient's whole amount. */
  of: number;
}

/** A share as an exact fraction, used to add them up without floating point drift. */
export interface Share {
  part: number;
  of: number;
}

/** What the model writes: an ingredient name instead of an order, and a share it may omit. */
export interface UsageInput {
  name: string;
  part?: number;
  of?: number;
}

const storedUsageSchema = z
  .object({
    order: z.int().nonnegative(),
    part: z.int().positive(),
    of: z.int().positive(),
  })
  .refine((usage) => usage.part <= usage.of, {
    message: "The share cannot be larger than the whole ingredient",
  });

/**
 * Reads the JSON column into usages.
 *
 * Lenient by design: a malformed entry is dropped rather than thrown, because this runs while
 * rendering a recipe and bad data there must not take the page down.
 */
export function parseIngredientUsages(value: unknown): IngredientUsage[] {
  if (!Array.isArray(value)) return [];

  const usages: IngredientUsage[] = [];

  for (const entry of value) {
    const parsed = storedUsageSchema.safeParse(entry);
    if (parsed.success) usages.push(parsed.data);
  }

  return usages;
}

/** Normalizes a name for comparison: case and accents are the author's, not ours. */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Turns usages written by ingredient name into usages by ingredient order, which is what the
 * recipe stores.
 *
 * The agent writes names because it has just written the ingredient list in the same call, and
 * copying a name is far more reliable for it than counting indices. An unknown name throws
 * instead of being dropped: a name that matches nothing is a mistake worth surfacing, not an
 * assignment that quietly goes missing.
 */
export function resolveUsagesByName(
  usages: UsageInput[],
  ingredients: { order: number; name: string }[],
): IngredientUsage[] {
  const orderByName = new Map(
    ingredients.map((ingredient) => [
      normalizeName(ingredient.name),
      ingredient.order,
    ]),
  );

  return usages.map((usage) => {
    const order = orderByName.get(normalizeName(usage.name));

    if (order === undefined) {
      const valid = ingredients.map((ingredient) => ingredient.name).join(", ");
      throw new Error(
        `The step uses an ingredient that is not in the recipe: "${usage.name}". ` +
          `Use one of these exact names: ${valid}.`,
      );
    }

    const part = usage.part ?? 1;
    const of = usage.of ?? 1;

    if (part < 1 || of < 1 || part > of) {
      throw new Error(
        `The share for "${usage.name}" must be a fraction between 0 and 1 ` +
          `(e.g. part: 1, of: 2 for half of it), and it was ${part}/${of}.`,
      );
    }

    return { order, part, of };
  });
}

/** The fraction of the ingredient a usage consumes, as a number in (0, 1]. */
export function usageShare(usage: IngredientUsage): number {
  return usage.part / usage.of;
}

/**
 * Re-points usages at the ingredient they still refer to after the ingredient list is rewritten.
 *
 * Ingredient rows are deleted and recreated on every save, so an `order` only means something
 * within one version of the list: reordering the ingredients would otherwise leave every usage
 * pointing at whatever moved into that slot. The name is what survives a reorder, so a usage
 * follows its ingredient and one whose ingredient is gone is dropped.
 */
export function remapUsagesByName(
  usages: IngredientUsage[],
  previousIngredients: { order: number; name: string }[],
  nextIngredients: { order: number; name: string }[],
): IngredientUsage[] {
  const nameByPreviousOrder = new Map(
    previousIngredients.map((ingredient) => [
      ingredient.order,
      normalizeName(ingredient.name),
    ]),
  );
  const orderByNextName = new Map(
    nextIngredients.map((ingredient) => [
      normalizeName(ingredient.name),
      ingredient.order,
    ]),
  );

  const remapped: IngredientUsage[] = [];

  for (const usage of usages) {
    const name = nameByPreviousOrder.get(usage.order);
    if (name === undefined) continue;

    const order = orderByNextName.get(name);
    if (order === undefined) continue;

    remapped.push({ ...usage, order });
  }

  return remapped;
}

/**
 * The factor every amount on the recipe page is multiplied by when the cook changes the servings.
 *
 * Shared by the ingredient list and the per-step amounts so the two can never disagree.
 */
export function servingsRatio(
  servings: number,
  defaultServings: number,
): number {
  return servings / defaultServings;
}

/** How much of an ingredient a step consumes, already scaled to the chosen servings. */
export function scaledUsageAmount(
  quantity: number,
  usage: IngredientUsage,
  servings: number,
  defaultServings: number,
): number {
  return (
    quantity * usageShare(usage) * servingsRatio(servings, defaultServings)
  );
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/** Reduces a fraction so comparisons stay on small integers. */
function reduceShare({ part, of }: Share): Share {
  const divisor = greatestCommonDivisor(part, of);

  return divisor > 1
    ? { part: part / divisor, of: of / divisor }
    : { part, of };
}

/**
 * Adds shares up exactly, keeping them as a fraction.
 *
 * Floating point would make 1/3 + 2/3 come out as 0.999…, which is the difference between the
 * editor saying "completo" and saying there is a crumb left over.
 */
export function sumShares(usages: IngredientUsage[]): Share {
  let sum: Share = { part: 0, of: 1 };

  for (const usage of usages) {
    sum = {
      part: sum.part * usage.of + usage.part * sum.of,
      of: sum.of * usage.of,
    };
  }

  return reduceShare(sum);
}

/**
 * Total share each ingredient has been assigned across every step, keyed by ingredient order.
 *
 * Used by the editor to show what a step leaves unassigned and to flag a split that adds up to
 * more than the whole ingredient.
 */
export function assignmentByIngredient(
  usagesByStep: IngredientUsage[][],
): Map<number, Share> {
  const usagesByOrder = new Map<number, IngredientUsage[]>();

  for (const usages of usagesByStep) {
    for (const usage of usages) {
      const forOrder = usagesByOrder.get(usage.order) ?? [];
      forOrder.push(usage);
      usagesByOrder.set(usage.order, forOrder);
    }
  }

  return new Map(
    [...usagesByOrder].map(([order, usages]) => [order, sumShares(usages)]),
  );
}

/**
 * The share an amount represents of an ingredient's own amount, reduced to lowest terms.
 *
 * Amounts carry at most three decimals, so scaling by 1000 keeps the fraction exact: "100 of
 * 200 g" becomes 1/2 rather than 0.5. Returns null when there is nothing to take a share of,
 * which is the case for salt and pepper.
 */
export function shareFromAmount(
  amount: number,
  quantity: number,
): Share | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const scaledQuantity = Math.round(quantity * 1000);
  if (scaledQuantity <= 0) return null;

  const scaledAmount = Math.min(Math.round(amount * 1000), scaledQuantity);

  return reduceShare({ part: scaledAmount, of: scaledQuantity });
}
