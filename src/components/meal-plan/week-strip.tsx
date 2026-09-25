"use client";

import { useTranslations } from "next-intl";
import { cn } from "~/lib/utils";
import type { Locale } from "~/lib/locales";
import { formatDayNumber, formatWeekdayNarrow } from "./format";

interface WeekStripProps {
  locale: Locale;
  days: string[];
  today: string;
  counts: Record<string, number>;
  onSelectDay: (isoDate: string) => void;
}

/**
 * The at-a-glance view of the week: one chip per day showing how many meals are planned. It is
 * the fastest way to see the shape of the week ("Tuesday none, Wednesday four") without opening
 * every day, and tapping a chip jumps to it.
 */
export function WeekStrip({
  locale,
  days,
  today,
  counts,
  onSelectDay,
}: WeekStripProps) {
  const t = useTranslations("Calendar");

  return (
    <div
      className="flex items-stretch gap-1.5 lg:hidden"
      role="group"
      aria-label={t("title")}
    >
      {days.map((day) => {
        const count = counts[day] ?? 0;
        const isToday = day === today;

        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay(day)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-1 py-2 transition-colors",
              isToday
                ? "border-primary/50 bg-primary/5"
                : "border-border/60 bg-card hover:bg-muted/50",
            )}
          >
            <span className="text-muted-foreground flex items-baseline gap-1">
              <span className="text-[0.65rem] font-semibold tracking-wide uppercase">
                {formatWeekdayNarrow(locale, day)}
              </span>
              <span className="text-[0.65rem]">
                {formatDayNumber(locale, day)}
              </span>
            </span>

            <span
              className={cn(
                "flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                count > 0
                  ? "bg-primary text-primary-foreground px-1.5"
                  : "border-border size-6 border border-dashed",
              )}
            >
              {count > 0 ? count : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
