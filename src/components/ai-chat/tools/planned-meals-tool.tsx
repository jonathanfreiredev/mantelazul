"use client";

import { CalendarDaysIcon, UsersIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { toDbDate } from "~/lib/dates";
import { toLocale } from "~/lib/locales";
import type { MealPlanEntryDto } from "~/types/meal-plan";
import { Button } from "../../ui/button";
import { ToolResultCard } from "./tool-result-card";
import { type ToolPart } from "./tool-part";

interface PlannedMealsToolProps {
  part: ToolPart<"planMeals">;
  /** Called once the user navigates away, so the drawer can close. */
  onNavigate: () => void;
}

/** Groups the meals by day, keeping the order the server returned. */
function groupByDate(entries: MealPlanEntryDto[]) {
  const groups: { date: string; entries: MealPlanEntryDto[] }[] = [];

  for (const entry of entries) {
    const last = groups[groups.length - 1];

    if (last && last.date === entry.date) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.date, entries: [entry] });
    }
  }

  return groups;
}

/** Result of the 'planMeals' tool: the plan that was written to the calendar. */
export function PlannedMealsTool({ part, onNavigate }: PlannedMealsToolProps) {
  const t = useTranslations("Chat");
  const tCalendar = useTranslations("Calendar");
  const locale = toLocale(useLocale());
  const router = useRouter();

  if (part.state !== "output-available") return null;

  if (!part.output.success) {
    return (
      <ToolResultCard tone="error">
        <p>{t("planMealsFailed")}</p>
      </ToolResultCard>
    );
  }

  const groups = groupByDate(part.output.entries);
  const formatDate = (isoDate: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(toDbDate(isoDate));

  return (
    <ToolResultCard>
      <p className="font-medium">
        {t("plannedMeals", { count: part.output.entries.length })}
      </p>

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.date} className="flex flex-col gap-1">
            <p className="text-xs font-medium opacity-70">
              {formatDate(group.date)}
            </p>

            <ul className="flex flex-col gap-1">
              {group.entries.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {entry.recipe.title}
                  </span>
                  <span className="shrink-0 opacity-70">
                    {tCalendar("servings", {
                      count: entry.servings ?? entry.recipe.defaultServings,
                    })}
                  </span>
                  {!entry.isPrivate && (
                    <span
                      className="shrink-0 text-blue-600"
                      title={t("planMealsShared")}
                    >
                      <UsersIcon className="size-3.5" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => {
          router.push("/calendar");
          onNavigate();
        }}
      >
        <CalendarDaysIcon /> {t("viewCalendar")}
      </Button>
    </ToolResultCard>
  );
}
