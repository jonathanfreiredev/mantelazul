"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

const MAX_NAME_LENGTH = 60;

/** Shown when the user belongs to no household yet. */
export function HouseholdCreateForm() {
  const t = useTranslations("Household");
  const utils = api.useUtils();
  const [name, setName] = useState("");

  const createMutation = api.households.create.useMutation();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = name.trim();

    if (!trimmed) {
      toast.error(t("nameRequired"));
      return;
    }

    try {
      await createMutation.mutateAsync({ name: trimmed });
      await utils.households.getMine.invalidate();
      toast.success(t("created"));
    } catch (error) {
      toast.error(t("createError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("createTitle")}</CardTitle>
        <CardDescription>{t("createDescription")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="household-name">{t("nameLabel")}</FieldLabel>
            <Input
              id="household-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
              required
            />
          </Field>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="self-start"
          >
            {t("create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
