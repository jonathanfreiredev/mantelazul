import z from "zod";
import { isIsoDate } from "~/lib/dates";
import { DEFAULT_LOCALE, LOCALES } from "~/lib/locales";

const MAX_SERVINGS = 99;
const MAX_NOTE_LENGTH = 500;

const isoDateSchema = z
  .string()
  .refine(isIsoDate, { message: "Expected a YYYY-MM-DD date" });

export const mealPlanWeekSchema = z.object({
  /** Any day of the week to load; the server resolves it to that week's Monday. */
  date: isoDateSchema,
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
});

export const mealPlanEntryCreateSchema = z.object({
  date: isoDateSchema,
  recipeId: z.string(),
  servings: z.number().int().positive().max(MAX_SERVINGS).optional(),
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
  /** Shared with the household when true, private to the creator when false. */
  shared: z.boolean().default(true),
});

export const mealPlanEntryUpdateSchema = z.object({
  id: z.string(),
  date: isoDateSchema.optional(),
  servings: z.number().int().positive().max(MAX_SERVINGS).nullable().optional(),
  note: z.string().trim().max(MAX_NOTE_LENGTH).nullable().optional(),
  /** Moves the meal between private and shared with the household. Creator only. */
  shared: z.boolean().optional(),
});
