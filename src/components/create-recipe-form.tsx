"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "./ui/field";
import { Unit } from "generated/prisma/enums";
import { Input } from "./ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "./ui/input-group";

const intSchema = z.int("It must be a positive number");

const formSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().trim(),
  imageUrl: z.url("Image URL must be a valid URL").trim().nullable(),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Ingredient name is required"),
        quantity: z.string().regex(/^\d+(\.\d{1,3})?$/, "Máximo 3 decimales"),
        unit: z.enum(Unit),
      }),
    )
    .min(1, "At least one ingredient is required"),
  defaultServings: z
    .int("It must be a positive number")
    .min(1, "It must be at least 1"),
  preparationTime: intSchema,
  cookingTime: intSchema,
  restingTime: intSchema,
  calories: intSchema,
  carbohydrates: intSchema,
  protein: intSchema,
  fat: intSchema,
  tags: z.array(z.string().min(1, "Tag cannot be empty").trim()),
});

export const CreateRecipeForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: null,
      ingredients: [{ name: "Test", quantity: "0", unit: Unit.GRAM }],
      defaultServings: 1,
      preparationTime: 0,
      cookingTime: 0,
      restingTime: 0,
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      tags: [],
    },
    // resolver: (data, context, options) => {
    //   const result = formSchema.safeParse(data);
    //   console.log("Validation result:", result);
    //   if (result.success) {
    //     return { values: result.data, errors: {} };
    //   } else {
    //     const errors = result.error.flatten().fieldErrors;
    //     return { values: {}, errors };
    //   }
    // },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("Submitting form with data:", data);
  }

  return (
    <div
      className={cn("flex w-full max-w-125 flex-col gap-6", className)}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">New Recipe</CardTitle>
          <CardDescription>
            Fill out the form below to create a new recipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-create-recipe" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldSet className="mb-5 w-full">
              <FieldGroup>
                <Controller
                  name="title"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="title">Title</FieldLabel>
                      <Input
                        {...field}
                        id="title"
                        type="text"
                        placeholder="Delicious Pancakes"
                        required
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="description">Description</FieldLabel>
                      <Input
                        {...field}
                        id="description"
                        type="text"
                        placeholder="Fluffy pancakes made with love"
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="defaultServings"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="defaultServings">
                        Default Servings
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          {...field}
                          id="defaultServings"
                          type="number"
                          min={0}
                          step={1}
                          placeholder="10"
                          onChange={(e) => {
                            field.onChange(e.target.valueAsNumber);
                          }}
                        />
                      </InputGroup>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <FieldSeparator />

                <FieldSet>
                  <FieldLegend>Time Information</FieldLegend>
                  <FieldDescription>
                    Enter the preparation, cooking, and resting times for the
                    recipe. This will help users plan their cooking accordingly.
                  </FieldDescription>

                  <Controller
                    name="preparationTime"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="preparationTime">
                          Preparation
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="preparationTime"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="10"
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>min</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="cookingTime"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cookingTime">Cooking</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="cookingTime"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="20"
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>min</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="restingTime"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="restingTime">Resting</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="restingTime"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="5"
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>min</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldSet>

                <FieldSeparator />

                <FieldSet>
                  <FieldLegend>Nutritional Information</FieldLegend>
                  <FieldDescription>
                    Enter the nutritional information for the recipe. This will
                    help users understand the nutritional content of the dish.
                  </FieldDescription>
                  <Controller
                    name="calories"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="calories">Calories</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="calories"
                            type="number"
                            step={1}
                            min={0}
                            placeholder="500"
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>kcal</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="carbohydrates"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="carbohydrates">
                          Carbohydrates
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="carbohydrates"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="50"
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>grams</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="protein"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="protein">Protein</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="protein"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="20"
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>grams</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="fat"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="fat">Fat</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="fat"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="10"
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>grams</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldSet>
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-create-recipe"
                disabled={form.formState.isSubmitting}
              >
                Create Recipe
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
