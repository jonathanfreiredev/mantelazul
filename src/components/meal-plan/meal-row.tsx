"use client";

import { UsersIcon, UtensilsIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { MealPlanEntryDto } from "~/types/meal-plan";
import { Item, ItemContent, ItemHeader, ItemTitle } from "../ui/item";

interface MealRowProps {
  entry: MealPlanEntryDto;
  /** Opening a meal is how it gets edited or checked; the whole card is the target. */
  onOpen: (entry: MealPlanEntryDto) => void;
}

/**
 * A planned meal as a small vertical card: square picture on top, title below. It fills whatever
 * width the day column has, so the same component reads well stacked on a phone and side by side
 * across the week on a wide screen.
 */
export function MealRow({ entry, onOpen }: MealRowProps) {
  const t = useTranslations("Calendar");

  return (
    <Item
      asChild
      variant="outline"
      className="hover:bg-muted/50 relative block p-2 transition-colors"
    >
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="cursor-pointer text-left"
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
      </button>
    </Item>
  );
}
