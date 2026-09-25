"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { addDays, DAYS_IN_WEEK, startOfWeek, todayIso } from "~/lib/dates";
import { toLocale } from "~/lib/locales";
import { api } from "~/trpc/react";
import type { MealPlanEntryDto } from "~/types/meal-plan";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { DayColumn } from "./day-column";
import { formatWeekRange } from "./format";
import { MealFormSheet } from "./meal-form-sheet";
import { RemoveMealDialog } from "./remove-meal-dialog";
import { WeekStrip } from "./week-strip";

interface CalendarProps {
  /** Today according to the server, used as the first render so hydration matches. */
  initialDate: string;
}

export function Calendar({ initialDate }: CalendarProps) {
  const t = useTranslations("Calendar");
  const locale = toLocale(useLocale());

  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [today, setToday] = useState(initialDate);
  const [formDate, setFormDate] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<MealPlanEntryDto | null>(
    null,
  );
  const [removingEntry, setRemovingEntry] = useState<MealPlanEntryDto | null>(
    null,
  );

  // The server's "today" is only a placeholder: once mounted, trust the user's own clock. The
  // week only moves when the local date falls in a different week, to avoid a needless refetch.
  useEffect(() => {
    const localToday = todayIso();
    setToday(localToday);
    setAnchorDate((current) =>
      startOfWeek(current) === startOfWeek(localToday) ? current : localToday,
    );
  }, []);

  const weekQuery = api.mealPlan.getWeek.useQuery({
    date: anchorDate,
    locale,
  });
  const householdQuery = api.households.getMine.useQuery();

  const startDate = weekQuery.data?.startDate ?? startOfWeek(anchorDate);

  const days = useMemo(
    () =>
      Array.from({ length: DAYS_IN_WEEK }, (_, index) =>
        addDays(startDate, index),
      ),
    [startDate],
  );

  const entriesByDate = useMemo(() => {
    const grouped: Record<string, MealPlanEntryDto[]> = {};

    for (const entry of weekQuery.data?.entries ?? []) {
      (grouped[entry.date] ??= []).push(entry);
    }

    return grouped;
  }, [weekQuery.data]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        days.map((day) => [day, entriesByDate[day]?.length ?? 0]),
      ),
    [days, entriesByDate],
  );

  function goToWeek(weeks: number) {
    setAnchorDate((current) => addDays(current, weeks * DAYS_IN_WEEK));
  }

  function handleSelectDay(day: string) {
    const target = document.getElementById(`day-${day}`);
    if (!target) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function handleAdd(date: string) {
    setEditingEntry(null);
    setFormDate(date);
  }

  function handleOpenEntry(entry: MealPlanEntryDto) {
    setEditingEntry(entry);
    setFormDate(entry.date);
  }

  // Deleting lives in the meal form; it hands the entry over to the confirmation dialog. The
  // edited entry is deliberately kept so the sheet keeps showing "Edit meal" while it closes.
  function handleRemoveFromForm(entry: MealPlanEntryDto) {
    setFormDate(null);
    setRemovingEntry(entry);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goToWeek(-1)}
            aria-label={t("previousWeek")}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => goToWeek(1)}
            aria-label={t("nextWeek")}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        <span className="text-sm font-medium">
          {formatWeekRange(locale, startDate)}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAnchorDate(today)}
        >
          {t("today")}
        </Button>
      </div>

      <WeekStrip
        locale={locale}
        days={days}
        today={today}
        counts={counts}
        onSelectDay={handleSelectDay}
      />

      {!householdQuery.isLoading && !householdQuery.data && (
        <p className="border-border/70 bg-muted/20 text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">
          {t("noHousehold")}
        </p>
      )}

      {weekQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : weekQuery.isError ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {t("loadError")}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-7">
          {days.map((day) => (
            <DayColumn
              key={day}
              locale={locale}
              date={day}
              entries={entriesByDate[day] ?? []}
              isToday={day === today}
              onAdd={handleAdd}
              onOpen={handleOpenEntry}
            />
          ))}
        </div>
      )}

      <MealFormSheet
        open={formDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFormDate(null);
            setEditingEntry(null);
          }
        }}
        date={formDate ?? today}
        entry={editingEntry}
        canShare={!!householdQuery.data}
        onRemove={handleRemoveFromForm}
      />

      <RemoveMealDialog
        entry={removingEntry}
        onOpenChange={(open) => {
          if (!open) setRemovingEntry(null);
        }}
      />
    </div>
  );
}
