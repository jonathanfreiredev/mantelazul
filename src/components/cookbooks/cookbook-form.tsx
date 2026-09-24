"use client";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { Input } from "../ui/input";

interface CookbookFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the form values type lives with the caller; this component only wires fields through to react-hook-form.
  control: any;
}

export function CookbookForm({ control }: CookbookFormProps) {
  const t = useTranslations("Cookbook");

  return (
    <FieldSet className="mb-5 w-full">
      <FieldGroup className="w-full">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
              <Input
                {...field}
                id="name"
                type="text"
                placeholder={t("namePlaceholder")}
                required
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </FieldSet>
  );
}
