"use client";

import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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

/** The ids of a day, as a string, to tell whether a drag changed that day. */
function idsOf(entries: MealPlanEntryDto[] | undefined): string {
  return (entries ?? []).map((entry) => entry.id).join(",");
}

export function Calendar({ initialDate }: CalendarProps) {
  const t = useTranslations("Calendar");
  const locale = toLocale(useLocale());
  const utils = api.useUtils();

  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [today, setToday] = useState(initialDate);
  const [formDate, setFormDate] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<MealPlanEntryDto | null>(
    null,
  );
  const [removingEntry, setRemovingEntry] = useState<MealPlanEntryDto | null>(
    null,
  );
  /** The arrangement while a drag is in progress. The query is the source of truth otherwise. */
  const [dragOrder, setDragOrder] = useState<Record<
    string,
    MealPlanEntryDto[]
  > | null>(null);
  const dragStartRef = useRef<Record<string, MealPlanEntryDto[]> | null>(null);
  /** Mirrors `dragOrder` for the drag handlers, which must not read deferred state. */
  const dragOrderRef = useRef<Record<string, MealPlanEntryDto[]> | null>(null);

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

  // Every day of the week is present, even the empty ones: the drag helper looks up the day a
  // meal is dropped on by key, so a day that is missing from the record cannot receive one.
  const entriesByDate = useMemo(() => {
    const grouped = Object.fromEntries(
      days.map((day) => [day, [] as MealPlanEntryDto[]]),
    );

    for (const entry of weekQuery.data?.entries ?? []) {
      (grouped[entry.date] ??= []).push(entry);
    }

    return grouped;
  }, [days, weekQuery.data]);

  const visibleByDate = dragOrder ?? entriesByDate;

  const counts = useMemo(
    () =>
      Object.fromEntries(
        days.map((day) => [day, visibleByDate[day]?.length ?? 0]),
      ),
    [days, visibleByDate],
  );

  const reorderMutation = api.mealPlan.reorder.useMutation({
    onSuccess: () => {
      void utils.mealPlan.getWeek.invalidate();
    },
    onError: () => {
      toast.error(t("reorderError"));
      void utils.mealPlan.getWeek.invalidate();
    },
  });

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

  function handleDragStart() {
    dragStartRef.current = entriesByDate;
    dragOrderRef.current = entriesByDate;
    setDragOrder(entriesByDate);
  }

  // dnd-kit reorders its own model during the drag; mirroring it in state is what moves a card
  // into another day, and what lets a meal land on a day that is empty. `move` is computed right
  // away, not inside the state updater: it reads the live drag operation, which moves on.
  function handleDragOver(event: DragOverEvent) {
    const base = dragOrderRef.current ?? entriesByDate;
    const next = move(base, event);

    if (next === base) return;

    dragOrderRef.current = next;
    setDragOrder(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const before = dragStartRef.current ?? entriesByDate;
    dragStartRef.current = null;
    dragOrderRef.current = null;
    setDragOrder(null);

    if (event.canceled) return;

    const after = move(before, event);
    const changedDays = days.filter(
      (day) => idsOf(before[day]) !== idsOf(after[day]),
    );

    if (changedDays.length === 0) return;

    // Show the new arrangement immediately, then let the server confirm it.
    utils.mealPlan.getWeek.setData({ date: anchorDate, locale }, (old) =>
      old
        ? {
            ...old,
            entries: days.flatMap((day) =>
              (after[day] ?? []).map((entry, order) => ({
                ...entry,
                date: day,
                order,
              })),
            ),
          }
        : old,
    );

    reorderMutation.mutate({
      days: changedDays.map((day) => ({
        date: day,
        entryIds: (after[day] ?? []).map((entry) => entry.id),
      })),
    });
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
        <DragDropProvider
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-3 lg:grid-cols-7">
            {days.map((day) => (
              <DayColumn
                key={day}
                locale={locale}
                date={day}
                entries={visibleByDate[day] ?? []}
                isToday={day === today}
                onAdd={handleAdd}
                onOpen={handleOpenEntry}
              />
            ))}
          </div>
        </DragDropProvider>
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
