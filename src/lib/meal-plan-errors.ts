/**
 * Error codes shared by the meal-plan router and its callers (the calendar UI and the agent
 * tools). They travel as the `message` of a `TRPCError`, so the caller can tell the known cases
 * apart from a generic failure.
 */
export const MEAL_PLAN_ERRORS = {
  /** At least one recipe does not exist, or is not visible to the caller. */
  recipesNotVisible: "recipes-not-visible",
  /** At least one meal does not exist, or is not visible to the caller. */
  entriesNotVisible: "entries-not-visible",
} as const;
