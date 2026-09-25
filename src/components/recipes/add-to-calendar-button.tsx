"use client";

import { CalendarPlusIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "~/i18n/navigation";
import { todayIso } from "~/lib/dates";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";

const MAX_SERVINGS = 99;
const MAX_NOTE_LENGTH = 500;

const ICON_SIZES = {
  sm: "size-4",
  md: "size-5",
  base: "size-6",
  lg: "size-7",
  xl: "size-8",
} as const;

interface AddToCalendarButtonProps {
  recipeId: string;
  defaultServings: number;
  isLoggedIn: boolean;
  className?: string;
  size?: keyof typeof ICON_SIZES;
}

/** Quick action on a recipe page: plan it for a day without leaving the recipe. */
export function AddToCalendarButton({
  recipeId,
  defaultServings,
  isLoggedIn,
  className,
  size = "base",
}: AddToCalendarButtonProps) {
  const t = useTranslations("Calendar");
  const tActions = useTranslations("RecipeActions");
  const router = useRouter();
  const utils = api.useUtils();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [servings, setServings] = useState("1");
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(true);

  const householdQuery = api.households.getMine.useQuery(undefined, {
    enabled: isLoggedIn && open,
  });
  const addMutation = api.mealPlan.add.useMutation();

  function handleOpen() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setDate(todayIso());
    setServings("1");
    setNote("");
    setShared(true);
    setOpen(true);
  }

  async function handleAdd() {
    const trimmed = servings.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);

    if (
      parsed !== null &&
      (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_SERVINGS)
    ) {
      toast.error(t("saveError"));
      return;
    }

    try {
      await addMutation.mutateAsync({
        date,
        recipeId,
        servings: parsed ?? undefined,
        note: note.trim() || undefined,
        shared,
      });
      await utils.mealPlan.getWeek.invalidate();
      toast.success(t("added"));
      setOpen(false);
    } catch (error) {
      toast.error(t("saveError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ opacity: 0.6, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1 border-0 bg-transparent p-0 transition-colors",
          className ?? "text-sm",
        )}
        onClick={handleOpen}
      >
        <CalendarPlusIcon className={ICON_SIZES[size]} />
        <span>{tActions("addToCalendar")}</span>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addTitle")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="add-calendar-date">
                  {t("dateLabel")}
                </FieldLabel>
                <Input
                  id="add-calendar-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="add-calendar-servings">
                  {t("servingsLabel")}
                </FieldLabel>
                <Input
                  id="add-calendar-servings"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_SERVINGS}
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                  placeholder={t("servingsPlaceholder", {
                    count: defaultServings,
                  })}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="add-calendar-note">
                {t("noteLabel")}
              </FieldLabel>
              <Textarea
                id="add-calendar-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("notePlaceholder")}
                maxLength={MAX_NOTE_LENGTH}
              />
            </Field>

            {householdQuery.data && (
              <Field>
                <FieldLabel>{t("visibilityLabel")}</FieldLabel>
                <RadioGroup
                  value={shared ? "shared" : "private"}
                  onValueChange={(value) => setShared(value === "shared")}
                  className="sm:grid-cols-2"
                >
                  <label
                    htmlFor="add-calendar-shared"
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors",
                      shared
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/60",
                    )}
                  >
                    <RadioGroupItem id="add-calendar-shared" value="shared" />
                    <span className="text-sm font-medium">
                      {t("visibilityShared")}
                    </span>
                  </label>

                  <label
                    htmlFor="add-calendar-private"
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors",
                      !shared
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/60",
                    )}
                  >
                    <RadioGroupItem id="add-calendar-private" value="private" />
                    <span className="text-sm font-medium">
                      {t("visibilityPrivate")}
                    </span>
                  </label>
                </RadioGroup>
              </Field>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={addMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? <Spinner /> : null}
              {t("addMeal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
