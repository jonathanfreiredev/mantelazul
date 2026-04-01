import { Unit } from "generated/prisma/enums";
import { Controller } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../ui/field";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface RecipeIngredientFormProps {
  index: number;
  fieldId: string;
  control: any;
}

export function RecipeIngredientForm({
  index,
  fieldId,
  control,
}: RecipeIngredientFormProps) {
  return (
    <FieldGroup key={fieldId} className="flex w-full flex-col gap-4 px-6 py-2">
      <FieldGroup className="flex w-full flex-row items-center">
        <Controller
          name={`ingredients.${index}.name`}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`ingredients.${index}.name`}>
                Name
              </FieldLabel>
              <Input
                {...controllerField}
                id={`ingredients.${index}.name`}
                aria-invalid={fieldState.invalid}
                placeholder="Ingredient Name"
                type="text"
                required
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup className="flex w-full flex-row items-center gap-4">
        <Controller
          name={`ingredients.${index}.quantity`}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`ingredients.${index}.quantity`}>
                Quantity
              </FieldLabel>
              <Input
                {...controllerField}
                id={`ingredients.${index}.quantity`}
                type="number"
                min={0}
                step={0.001}
                placeholder="0"
                onChange={(event) => {
                  //if the value has more than 3 decimal places, round it to 3 decimal places
                  const value = parseFloat(event.target.value);
                  if (isNaN(value)) {
                    controllerField.onChange("");
                    return;
                  }
                  const roundedValue = Math.round(value * 1000) / 1000;
                  controllerField.onChange(roundedValue.toString());
                }}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name={`ingredients.${index}.unit`}
          control={control}
          render={({ field, fieldState }) => (
            <Field orientation="responsive" data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor={`ingredients.${index}.unit`}>
                  Unit
                </FieldLabel>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={`ingredients.${index}.unit`}
                  aria-invalid={fieldState.invalid}
                  className="min-w-30"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {Object.entries(Unit).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {key.charAt(0) + key.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </FieldGroup>
    </FieldGroup>
  );
}
