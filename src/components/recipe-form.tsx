"use client";
import { Category, Difficulty } from "generated/prisma/enums";
import { TrashIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { capitalize } from "~/lib/utils";
import { ImageUpload } from "./image-uploader/image-upload";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "./ui/field";
import { Input } from "./ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "./ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

interface RecipeFormProps {
  control: any;
}

export function RecipeForm({ control }: RecipeFormProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  return (
    <FieldSet className="mb-5 w-full">
      <FieldGroup className="w-full">
        <Controller
          name="image"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="image" className="sr-only">
                Picture
              </FieldLabel>
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <div className="relative h-32 overflow-hidden rounded-sm bg-gray-100">
                    {field.value ? (
                      <>
                        <Image
                          src={field.value.preview}
                          alt="Recipe Image"
                          fill
                          className="object-cover"
                        />

                        <Button
                          variant="secondary"
                          size="icon-lg"
                          color="red"
                          className="absolute right-0 z-20 m-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            field.onChange(null);
                            setImageDialogOpen(false);
                          }}
                        >
                          <TrashIcon />
                        </Button>
                      </>
                    ) : (
                      <p className="flex h-full w-full items-center justify-center text-gray-500">
                        Click to upload image
                      </p>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Recipe Image</DialogTitle>
                    <DialogDescription>
                      Choose an image to represent your recipe. You can upload
                      an image file from your device.
                    </DialogDescription>
                  </DialogHeader>

                  <ImageUpload
                    id="image"
                    maxImages={1}
                    handleImages={(images) => {
                      if (images.length > 0) {
                        const image = images[0];
                        field.onChange(image);
                        setImageDialogOpen(false);
                      }
                    }}
                  />
                </DialogContent>
              </Dialog>
            </Field>
          )}
        />

        <Controller
          name="title"
          control={control}
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

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                {...field}
                id="description"
                aria-invalid={fieldState.invalid}
                placeholder="Fluffy pancakes made with love"
                rows={2}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="defaultServings"
          control={control}
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

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="category"
          control={control}
          render={({ field, fieldState }) => (
            <Field orientation="vertical" data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="category">Category</FieldLabel>
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
                  id="category"
                  aria-invalid={fieldState.invalid}
                  className="min-w-30"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {Object.entries(Category).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {key === Category.MAIN_COURSE
                        ? "Main Course"
                        : capitalize(key.toLowerCase().replace(/_/g, " "))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          name="difficulty"
          control={control}
          render={({ field, fieldState }) => (
            <Field orientation="vertical" data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="difficulty">Difficulty</FieldLabel>
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
                  id="difficulty"
                  aria-invalid={fieldState.invalid}
                  className="min-w-30"
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {Object.entries(Difficulty).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {capitalize(key.toLowerCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Time information</FieldLegend>
          <FieldDescription>
            Enter the preparation, cooking, and resting times for the recipe.
            This will help users plan their cooking accordingly.
          </FieldDescription>

          <FieldGroup className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="preparationTime"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="preparationTime">Preparation</FieldLabel>
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
              control={control}
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
              control={control}
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
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Nutritional information per serving</FieldLegend>
          <FieldDescription>
            Enter the nutritional information for the recipe. This will help
            users understand the nutritional content of the dish.
          </FieldDescription>

          <FieldGroup className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="calories"
              control={control}
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
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="carbohydrates">Carbohydrates</FieldLabel>
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
              control={control}
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
              control={control}
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
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </FieldSet>
  );
}
