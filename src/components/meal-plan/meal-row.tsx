"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { GripVerticalIcon, UsersIcon, UtensilsIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "~/lib/utils";
import type { MealPlanEntryDto } from "~/types/meal-plan";
import { Item, ItemContent, ItemHeader, ItemTitle } from "../ui/item";

interface MealRowProps {
  entry: MealPlanEntryDto;
  /** Position of the meal within its day, for drag and drop. */
  index: number;
  /** Day the meal belongs to. The drag group, so meals can move between days. */
  date: string;
  /** Opening a meal is how it gets edited or checked; the whole card is the target. */
  onOpen: (entry: MealPlanEntryDto) => void;
}

/**
 * A planned meal as a small vertical card: square picture on top, title below. It fills whatever
 * width the day column has, so the same component reads well stacked on a phone and side by side
 * across the week on a wide screen.
 *
 * The card is sortable. Only the grip starts a drag, so a tap still opens the meal and a touch
 * still scrolls the page.
 */
export function MealRow({ entry, index, date, onOpen }: MealRowProps) {
  const t = useTranslations("Calendar");
  const { ref, handleRef, isDragging } = useSortable({
    id: entry.id,
    index,
    group: date,
    type: "meal",
    accept: "meal",
  });

  return (
    <Item
      ref={ref}
      variant="outline"
      className={cn(
        "hover:bg-muted/50 relative block p-2 transition-colors",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="block w-full cursor-pointer text-left"
      >
        <ItemHeader>
          {entry.recipe.imageUrl ? (
            <Image
              src={entry.recipe.imageUrl}
              alt=""
              width={128}
              height={128}
              sizes="(min-width: 1024px) 160px, 50vw"
              className="aspect-square w-full rounded-sm object-cover"
            />
          ) : (
            <span className="bg-muted text-muted-foreground flex aspect-square w-full items-center justify-center rounded-sm">
              <UtensilsIcon className="size-5" />
            </span>
          )}
        </ItemHeader>

        <ItemContent className="mt-2">
          <ItemTitle className="line-clamp-2 w-full">
            {entry.recipe.title}
          </ItemTitle>
        </ItemContent>
      </button>

      {/* A shared meal is the notable case, so it is the one that gets a badge: a blue pill
          matching the brand, meaning "the household sees this". Private meals carry nothing. */}
      {!entry.isPrivate && (
        <span
          title={t("shared")}
          className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
        >
          <UsersIcon className="size-3" />
        </span>
      )}

      <button
        ref={handleRef}
        type="button"
        aria-label={t("reorderMeal")}
        className="bg-background/80 text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-2 left-2 flex size-8 cursor-grab touch-none items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none active:cursor-grabbing md:size-6"
      >
        <GripVerticalIcon className="size-4 md:size-3.5" />
      </button>
    </Item>
  );
}
