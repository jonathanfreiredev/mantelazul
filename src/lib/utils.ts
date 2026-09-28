import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Fractions people actually recognise in a kitchen. Anything past eighths ("66 667/1000") is a
 * number the formatter produced, not one a cook wrote, and reads better as a decimal.
 */
const MAX_FRACTION_DENOMINATOR = 8;

/** How close a value has to be to a fraction to count as that fraction. */
const FRACTION_TOLERANCE = 1.0e-6;

export function formatQuantity(value: number): string {
  // Si es entero → sin decimales
  if (Number.isInteger(value)) {
    return value.toString();
  }

  // The simplest fraction that matches: halves, thirds, quarters and eighths. A third of 200 g
  // matches 2/3 and shows as "66 2/3"; an amount that is none of them falls through to a decimal.
  for (
    let denominator = 2;
    denominator <= MAX_FRACTION_DENOMINATOR;
    denominator++
  ) {
    const numerator = Math.round(value * denominator);

    if (
      numerator < 1 ||
      Math.abs(value - numerator / denominator) > FRACTION_TOLERANCE
    ) {
      continue;
    }

    // Si es tipo 3/2 → mostrar "1 1/2"
    if (numerator > denominator) {
      const whole = Math.floor(numerator / denominator);
      const remainder = numerator % denominator;

      return remainder === 0
        ? whole.toString()
        : `${whole} ${remainder}/${denominator}`;
    }

    return `${numerator}/${denominator}`;
  }

  return value.toFixed(3).replace(/\.?0+$/, "");
}
