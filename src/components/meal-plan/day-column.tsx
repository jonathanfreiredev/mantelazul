"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale } from "~/lib/locales";
import { cn } from "~/lib/utils";
import type { MealPlanEntryDto } from "~/types/meal-plan";
import { Button } from "../ui/button";
import { formatDayTitle } from "./format";
import { MealRow } from "./meal-row";

interface DayColumnProps {
  locale: Locale;
  date: string;
  entries: MealPlanEntryDto[];
  isToday: boolean;
  onAdd: (date: string) => void;
  onOpen: (entry: MealPlanEntryDto) => void;
}

/**
 * One day of the week. On phones the days stack as sections; from `lg` up they line up as the
 * Monday-to-Sunday board.
 */
export function DayColumn({
  locale,
  date,
  entries,
  isToday,
  onAdd,
  onOpen,
}: DayColumnProps) {
  const t = useTranslations("Calendar");
  const dayTitle = formatDayTitle(locale, date);

  return (
    <section
      id={`day-${date}`}
      className={cn(
        "bg-card flex scroll-mt-6 flex-col rounded-xl border lg:min-h-56",
        isToday ? "border-primary/40" : "border-border/60",
      )}
    >
      <header className="border-border/50 flex items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className={cn("text-sm font-medium", isToday && "text-primary")}>
          {dayTitle}
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onAdd(date)}
          aria-label={t("addTo", { day: dayTitle })}
        >
          <PlusIcon />
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-2">
        {entries.length === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(date)}
            className="border-border/70 text-muted-foreground hover:bg-muted/40 flex flex-1 items-center justify-center rounded-lg border border-dashed px-2 py-4 text-xs transition-colors"
          >
            {t("nothingPlanned")}
          </button>
        ) : (
          <>
            {/* A grid so the cards stay a sensible size when the days are stacked: two per row on
                a phone, up to four on a tablet, and a single column inside the week board. */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1">
              {entries.map((entry) => (
                <MealRow key={entry.id} entry={entry} onOpen={onOpen} />
              ))}
            </div>

            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground mt-auto justify-start"
              onClick={() => onAdd(date)}
            >
              <PlusIcon />
              {t("addMeal")}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
