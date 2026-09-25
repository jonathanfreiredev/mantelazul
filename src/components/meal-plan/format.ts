import { addDays, DAYS_IN_WEEK, toDbDate } from "~/lib/dates";
import type { Locale } from "~/lib/locales";

/**
 * "Sep 21 – Sep 27, 2026", localized and locale-aware about the order.
 *
 * `Intl.formatRange` is deliberately avoided: it picks a locale-specific separator that can differ
 * between the server's ICU data and the browser's, which makes React report a hydration mismatch
 * on an otherwise identical string.
 */
export function formatWeekRange(locale: Locale, startDate: string): string {
  const start = toDbDate(startDate);
  const end = toDbDate(addDays(startDate, DAYS_IN_WEEK - 1));

  const startLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(start);

  const endLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

/** "Lunes 22". */
export function formatDayTitle(locale: Locale, isoDate: string): string {
  const date = toDbDate(isoDate);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
    date,
  );
  const day = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day}`;
}

/** Single letter for the week strip: "L", "M", "X". */
export function formatWeekdayNarrow(locale: Locale, isoDate: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
    toDbDate(isoDate),
  );
}

export function formatDayNumber(locale: Locale, isoDate: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric" }).format(
    toDbDate(isoDate),
  );
}

/** Long date for invitations: "5 de octubre de 2026". */
export function formatLongDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
