import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export function formatQuantity(value: number): string {
  // Si es entero → sin decimales
  if (Number.isInteger(value)) {
    return value.toString();
  }

  // Convertir a fracción con máximo 3 decimales
  const tolerance = 1.0e-6;
  let numerator = value;
  let denominator = 1;

  while (
    Math.abs(Math.round(numerator) - numerator) > tolerance &&
    denominator <= 1000
  ) {
    numerator *= 10;
    denominator *= 10;
  }

  numerator = Math.round(numerator);

  // Simplificar fracción
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = gcd(numerator, denominator);

  numerator /= divisor;
  denominator /= divisor;

  // Si es tipo 3/2 → mostrar "1 1/2"
  if (numerator > denominator) {
    const whole = Math.floor(numerator / denominator);
    const remainder = numerator % denominator;
    if (remainder === 0) return whole.toString();
    return `${whole} ${remainder}/${denominator}`;
  }

  return `${numerator}/${denominator}`;
}
