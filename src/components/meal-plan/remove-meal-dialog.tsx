"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { MealPlanEntryDto } from "~/types/meal-plan";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface RemoveMealDialogProps {
  entry: MealPlanEntryDto | null;
  onOpenChange: (open: boolean) => void;
}

export function RemoveMealDialog({
  entry,
  onOpenChange,
}: RemoveMealDialogProps) {
  const t = useTranslations("Calendar");
  const utils = api.useUtils();
  const removeMutation = api.mealPlan.remove.useMutation();

  async function handleRemove() {
    if (!entry) return;

    try {
      await removeMutation.mutateAsync({ id: entry.id });
      await utils.mealPlan.getWeek.invalidate();
      toast.success(t("removed"));
      onOpenChange(false);
    } catch (error) {
      toast.error(t("removeError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("removeTitle")}</DialogTitle>
          <DialogDescription>
            {entry
              ? t("removeDescription", { title: entry.recipe.title })
              : null}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={removeMutation.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={removeMutation.isPending}
          >
            {t("removeConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
