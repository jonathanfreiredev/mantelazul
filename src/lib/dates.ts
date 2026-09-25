/**
 * Helpers for calendar days. A "day" is a `YYYY-MM-DD` string everywhere in the API, and it is
 * stored as a Postgres `date` (Prisma `@db.Date`) at UTC midnight. Keeping the whole feature on
 * plain calendar days avoids timezone drift: a meal planned for Monday is Monday no matter where
 * the user opens the app.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Days from Monday to Sunday, used to lay out a week. */
export const DAYS_IN_WEEK = 7;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  // Rejects impossible dates such as 2026-02-31, which `Date` would silently roll over.
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value;
}

/** `YYYY-MM-DD` -> the UTC-midnight `Date` Prisma stores in a `date` column. */
export function toDbDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** A `Date` read back from the database -> `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The Monday of the week that contains `isoDate`. Weeks always start on Monday. */
export function startOfWeek(isoDate: string): string {
  const date = toDbDate(isoDate);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return toIsoDate(date);
}

/** Moves an ISO date by a number of days, forwards or backwards. */
export function addDays(isoDate: string, days: number): string {
  const date = toDbDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** Today as an ISO date. Used as the default day when adding a meal. */
export function todayIso(): string {
  return toIsoDate(new Date());
}
