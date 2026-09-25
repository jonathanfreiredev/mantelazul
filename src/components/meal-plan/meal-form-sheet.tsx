"use client";

import { SearchIcon, Trash2Icon, UtensilsIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { Link } from "~/i18n/navigation";
import { toLocale } from "~/lib/locales";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { MealPlanEntryDto, MealPlanRecipeDto } from "~/types/meal-plan";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "../ui/drawer";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import { formatDayTitle } from "./format";

const MAX_SERVINGS = 99;
const MAX_NOTE_LENGTH = 500;
const SEARCH_RESULTS = 8;

/** A new meal starts with a single serving; the user can raise it. */
const DEFAULT_SERVINGS = "1";

interface MealFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Day to add to, or the day of the entry being edited. */
  date: string;
  /** When set, the sheet edits this meal instead of adding a new one. */
  entry: MealPlanEntryDto | null;
  /** Whether the user belongs to a household, and can therefore share the meal. */
  canShare: boolean;
  /** Called when the user asks to delete the meal being edited. */
  onRemove: (entry: MealPlanEntryDto) => void;
}

export function MealFormSheet({
  open,
  onOpenChange,
  date,
  entry,
  canShare,
  onRemove,
}: MealFormSheetProps) {
  const t = useTranslations("Calendar");
  const locale = toLocale(useLocale());
  const utils = api.useUtils();

  const isEditing = entry !== null;

  const [selectedRecipe, setSelectedRecipe] =
    useState<MealPlanRecipeDto | null>(null);
  const [search, setSearch] = useState("");
  const [day, setDay] = useState(date);
  const [servings, setServings] = useState("");
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(true);

  const debouncedSearch = useDebouncedValue(search, 250);

  // Reset the form every time the sheet opens so it never shows the previous meal.
  useEffect(() => {
    if (!open) return;

    setSearch("");
    setSelectedRecipe(entry ? entry.recipe : null);
    setDay(entry ? entry.date : date);
    setServings(
      entry ? (entry.servings ? String(entry.servings) : "") : DEFAULT_SERVINGS,
    );
    setNote(entry?.note ?? "");
    setShared(!entry?.isPrivate);
  }, [open, entry, date]);

  const searchQuery = api.recipes.getAll.useQuery(
    {
      search: debouncedSearch || undefined,
      locale,
      includeOwnUnpublished: true,
      skip: 0,
      take: SEARCH_RESULTS,
    },
    { enabled: open && !isEditing && !selectedRecipe },
  );

  const addMutation = api.mealPlan.add.useMutation();
  const updateMutation = api.mealPlan.update.useMutation();
  const isSaving = addMutation.isPending || updateMutation.isPending;

  // Only the creator can move a meal between private and shared, and only a member of a household
  // has a household to share it with.
  const canChangeVisibility =
    canShare && (!isEditing || entry?.isMine === true);

  async function handleSubmit() {
    if (!isEditing && !selectedRecipe) {
      toast.error(t("selectRecipe"));
      return;
    }

    const trimmedServings = servings.trim();
    const parsedServings =
      trimmedServings === "" ? null : Number(trimmedServings);

    if (
      parsedServings !== null &&
      (!Number.isInteger(parsedServings) ||
        parsedServings < 1 ||
        parsedServings > MAX_SERVINGS)
    ) {
      toast.error(t("saveError"));
      return;
    }

    try {
      if (isEditing && entry) {
        await updateMutation.mutateAsync({
          id: entry.id,
          date: day,
          servings: parsedServings,
          note: note.trim() || null,
          ...(canChangeVisibility ? { shared } : {}),
        });
      } else if (selectedRecipe) {
        await addMutation.mutateAsync({
          date: day,
          recipeId: selectedRecipe.id,
          servings: parsedServings ?? undefined,
          note: note.trim() || undefined,
          shared,
        });
      }

      await utils.mealPlan.getWeek.invalidate();
      toast.success(isEditing ? t("saved") : t("added"));
      onOpenChange(false);
    } catch (error) {
      toast.error(t("saveError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const defaultServings =
    selectedRecipe?.defaultServings ?? entry?.recipe.defaultServings;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between gap-2 px-4 pt-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <DrawerTitle>
              {isEditing ? t("editTitle") : t("addTitle")}
            </DrawerTitle>
            <DrawerDescription>{formatDayTitle(locale, day)}</DrawerDescription>
          </div>

          {isEditing && entry && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemove(entry)}
              aria-label={t("remove")}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
            >
              <Trash2Icon />
            </Button>
          )}
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2">
          {selectedRecipe ? (
            <div className="border-border/60 flex items-center gap-3 rounded-xl border p-2">
              <span className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md">
                {selectedRecipe.imageUrl ? (
                  <Image
                    src={selectedRecipe.imageUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground flex size-full items-center justify-center">
                    <UtensilsIcon className="size-4" />
                  </span>
                )}
              </span>

              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {selectedRecipe.title}
              </span>

              {isEditing ? (
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link href={`/recipes/${selectedRecipe.slug}`}>
                    {t("viewRecipe")}
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    setSelectedRecipe(null);
                    setSearch("");
                  }}
                >
                  <XIcon className="size-4" />
                </Button>
              )}
            </div>
          ) : (
            <Field>
              <FieldLabel htmlFor="meal-recipe-search">
                {t("recipeLabel")}
              </FieldLabel>

              <div className="relative">
                <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  id="meal-recipe-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("recipePlaceholder")}
                  className="pl-8"
                  autoComplete="off"
                />
              </div>

              <div className="mt-1 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                {searchQuery.isLoading ? (
                  <span className="flex justify-center py-6">
                    <Spinner />
                  </span>
                ) : searchQuery.data?.recipes.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    {t("noRecipes")}
                  </p>
                ) : (
                  searchQuery.data?.recipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipe({
                          id: recipe.id,
                          slug: recipe.slug,
                          title: recipe.title,
                          imageUrl: recipe.imageUrl,
                          defaultServings: recipe.defaultServings,
                        });
                        setSearch("");
                      }}
                      className="border-border/60 hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-2 text-left transition-colors"
                    >
                      <span className="bg-muted relative size-8 shrink-0 overflow-hidden rounded-md">
                        {recipe.imageUrl ? (
                          <Image
                            src={recipe.imageUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground flex size-full items-center justify-center">
                            <UtensilsIcon className="size-3.5" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {recipe.title}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="meal-date">{t("dateLabel")}</FieldLabel>
              <Input
                id="meal-date"
                type="date"
                value={day}
                onChange={(event) => setDay(event.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="meal-servings">
                {t("servingsLabel")}
              </FieldLabel>
              <Input
                id="meal-servings"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_SERVINGS}
                value={servings}
                onChange={(event) => setServings(event.target.value)}
                placeholder={
                  defaultServings
                    ? t("servingsPlaceholder", { count: defaultServings })
                    : undefined
                }
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="meal-note">{t("noteLabel")}</FieldLabel>
            <Textarea
              id="meal-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("notePlaceholder")}
              maxLength={MAX_NOTE_LENGTH}
            />
          </Field>

          {canChangeVisibility && (
            <Field>
              <FieldLabel>{t("visibilityLabel")}</FieldLabel>
              <RadioGroup
                value={shared ? "shared" : "private"}
                onValueChange={(value) => setShared(value === "shared")}
                className="sm:grid-cols-2"
              >
                <label
                  htmlFor="meal-visibility-shared"
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                    shared
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60",
                  )}
                >
                  <RadioGroupItem
                    id="meal-visibility-shared"
                    value="shared"
                    className="mt-0.5"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {t("visibilityShared")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("visibilitySharedHint")}
                    </span>
                  </span>
                </label>

                <label
                  htmlFor="meal-visibility-private"
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                    !shared
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60",
                  )}
                >
                  <RadioGroupItem
                    id="meal-visibility-private"
                    value="private"
                    className="mt-0.5"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {t("visibilityPrivate")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("visibilityPrivateHint")}
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </Field>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Spinner /> : null}
            {isEditing ? t("save") : t("addMeal")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
