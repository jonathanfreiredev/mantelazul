/** The recipe information a calendar entry needs, already resolved into the viewer's language. */
export interface MealPlanRecipeDto {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  defaultServings: number;
}

export interface MealPlanEntryDto {
  id: string;
  /** Calendar day, `YYYY-MM-DD`. */
  date: string;
  order: number;
  /** Planned servings, or null to fall back to the recipe's default. */
  servings: number | null;
  note: string | null;
  /** A meal without a household is private: only its creator can see it. */
  isPrivate: boolean;
  /** Whether the signed-in user created it. Only the creator can change its visibility. */
  isMine: boolean;
  /** Who added it, for attribution inside a shared household. */
  createdByName: string | null;
  recipe: MealPlanRecipeDto;
}

export interface MealPlanWeekDto {
  /** Monday of the week, `YYYY-MM-DD`. */
  startDate: string;
  entries: MealPlanEntryDto[];
}
