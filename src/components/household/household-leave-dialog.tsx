"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function HouseholdLeaveDialog() {
  const t = useTranslations("Household");
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);

  const leaveMutation = api.households.leave.useMutation();

  async function handleLeave() {
    try {
      await leaveMutation.mutateAsync();
      await utils.households.getMine.invalidate();
      await utils.mealPlan.getWeek.invalidate();
      toast.success(t("left"));
      setOpen(false);
    } catch (error) {
      toast.error(t("leaveError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="flex justify-end">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">{t("leave")}</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leaveTitle")}</DialogTitle>
            <DialogDescription>{t("leaveDescription")}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={leaveMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
            >
              {t("leaveConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
