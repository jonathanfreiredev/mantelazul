import z from "zod";
import { daysBetween, isIsoDate } from "~/lib/dates";
import { DEFAULT_LOCALE, LOCALES } from "~/lib/locales";

export const MAX_SERVINGS = 99;
export const MAX_NOTE_LENGTH = 500;
/** The most meals a single batch call can plan. */
export const MAX_MEALS_PER_BATCH = 50;
/** The most days a single read can span. */
export const MAX_RANGE_DAYS = 31;

export const isoDateSchema = z
  .string()
  .refine(isIsoDate, { message: "Expected a YYYY-MM-DD date" });

export const mealPlanWeekSchema = z.object({
  /** Any day of the week to load; the server resolves it to that week's Monday. */
  date: isoDateSchema,
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
});

export const mealPlanRangeSchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
    locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
  })
  .refine((value) => daysBetween(value.from, value.to) >= 0, {
    message: "The first day must not be after the last day",
  })
  .refine((value) => daysBetween(value.from, value.to) < MAX_RANGE_DAYS, {
    message: `The range cannot be longer than ${MAX_RANGE_DAYS} days`,
  });

const mealPlanEntryInputSchema = z.object({
  date: isoDateSchema,
  recipeId: z.string().min(1),
  servings: z.number().int().positive().max(MAX_SERVINGS).optional(),
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
  /** Shared with the household when true, private to the creator when false. */
  shared: z.boolean().default(true),
});

export const mealPlanEntryCreateSchema = mealPlanEntryInputSchema;

export const mealPlanEntryBatchCreateSchema = z.object({
  meals: z.array(mealPlanEntryInputSchema).min(1).max(MAX_MEALS_PER_BATCH),
  /** Language the created entries are returned in. */
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
});

export const mealPlanEntryUpdateSchema = z.object({
  id: z.string(),
  date: isoDateSchema.optional(),
  servings: z.number().int().positive().max(MAX_SERVINGS).nullable().optional(),
  note: z.string().trim().max(MAX_NOTE_LENGTH).nullable().optional(),
  /** Moves the meal between private and shared with the household. Creator only. */
  shared: z.boolean().optional(),
});
