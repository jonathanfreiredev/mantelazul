"use client";
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
  control: any;
}

export function CookbookForm({ control }: CookbookFormProps) {
  return (
    <FieldSet className="mb-5 w-full">
      <FieldGroup className="w-full">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                {...field}
                id="name"
                type="text"
                placeholder="My Cookbook"
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
