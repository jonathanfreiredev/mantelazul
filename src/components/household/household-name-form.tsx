"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

const MAX_NAME_LENGTH = 60;

interface HouseholdNameFormProps {
  name: string;
}

export function HouseholdNameForm({ name }: HouseholdNameFormProps) {
  const t = useTranslations("Household");
  const utils = api.useUtils();
  const [value, setValue] = useState(name);

  const renameMutation = api.households.rename.useMutation();

  useEffect(() => {
    setValue(name);
  }, [name]);

  const trimmed = value.trim();
  const isUnchanged = trimmed === name;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!trimmed || isUnchanged) return;

    try {
      await renameMutation.mutateAsync({ name: trimmed });
      await utils.households.getMine.invalidate();
      toast.success(t("renamed"));
    } catch (error) {
      toast.error(t("renameError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Card>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field>
            <FieldLabel htmlFor="household-rename">
              {t("renameLabel")}
            </FieldLabel>
            <Input
              id="household-rename"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
            />
          </Field>

          <Button
            type="submit"
            variant="outline"
            disabled={renameMutation.isPending || isUnchanged || !trimmed}
          >
            {t("rename")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
