import z from "zod";
import { DEFAULT_LOCALE, LOCALES } from "~/lib/locales";

export const householdNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
});

export const householdInviteSchema = z.object({
  email: z.email().trim(),
  // Used to write the invitation email and build its link in the inviter's language.
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
});
