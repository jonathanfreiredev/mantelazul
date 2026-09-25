"use client";
import { Category, Difficulty } from "generated/prisma/enums";
import { TrashIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { LOCALE_NAMES } from "~/hooks/use-locale-switch";
import { LOCALES } from "~/lib/locales";
import { ImageUpload } from "../image-uploader/image-upload";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
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
} from "../ui/field";
import { Input } from "../ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface RecipeFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the form values type lives with the caller; this component only wires fields through to react-hook-form.
  control: any;
  /** Renders the source-language picker. Only the update form can change it. */
  showSourceLocale?: boolean;
}

export function RecipeForm({
  control,
  showSourceLocale = false,
}: RecipeFormProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const t = useTranslations("RecipeForm");
  const tCategories = useTranslations("Categories");
  const tDifficulty = useTranslations("Difficulty");

  return (
    <FieldSet className="mb-5 w-full">
      <FieldGroup className="w-full">
        <Controller
          name="image"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="image" className="sr-only">
                {t("imageAlt")}
              </FieldLabel>
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <div className="relative h-32 overflow-hidden rounded-sm bg-gray-100">
                    {field.value ? (
                      <>
                        <Image
                          src={field.value.preview}
                          alt={t("imageAlt")}
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
                        {t("imagePlaceholder")}
                      </p>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("uploadTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("uploadDescription")}
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

        {showSourceLocale && (
          <Controller
            name="sourceLocale"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="sourceLocale">
                    {t("sourceLocale")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("sourceLocaleDescription")}
                  </FieldDescription>
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
                    id="sourceLocale"
                    aria-invalid={fieldState.invalid}
                    className="min-w-30"
                  >
                    <SelectValue placeholder={t("select")} />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {LOCALES.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {LOCALE_NAMES[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        )}

        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="title">{t("title")}</FieldLabel>
              <Input
                {...field}
                id="title"
                type="text"
                placeholder={t("titlePlaceholder")}
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
              <FieldLabel htmlFor="description">{t("description")}</FieldLabel>
              <Textarea
                {...field}
                id="description"
                aria-invalid={fieldState.invalid}
                placeholder={t("descriptionPlaceholder")}
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
                {t("defaultServings")}
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
                <FieldLabel htmlFor="category">{t("category")}</FieldLabel>
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
                  <SelectValue placeholder={t("select")} />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {Object.entries(Category).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {tCategories(value)}
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
                <FieldLabel htmlFor="difficulty">{t("difficulty")}</FieldLabel>
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
                  <SelectValue placeholder={t("select")} />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {Object.entries(Difficulty).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {tDifficulty(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t("timeLegend")}</FieldLegend>
          <FieldDescription>{t("timeDescription")}</FieldDescription>

          <FieldGroup className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="preparationTime"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="preparationTime">
                    {t("preparation")}
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
                      <InputGroupText>{t("min")}</InputGroupText>
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
                  <FieldLabel htmlFor="cookingTime">{t("cooking")}</FieldLabel>
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
                      <InputGroupText>{t("min")}</InputGroupText>
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
                  <FieldLabel htmlFor="restingTime">{t("resting")}</FieldLabel>
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
                      <InputGroupText>{t("min")}</InputGroupText>
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
          <FieldLegend>{t("nutritionLegend")}</FieldLegend>
          <FieldDescription>{t("nutritionDescription")}</FieldDescription>

          <FieldGroup className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="calories"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="calories">{t("calories")}</FieldLabel>
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
                      <InputGroupText>{t("kcal")}</InputGroupText>
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
                  <FieldLabel htmlFor="carbohydrates">
                    {t("carbohydrates")}
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
                      <InputGroupText>{t("grams")}</InputGroupText>
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
                  <FieldLabel htmlFor="protein">{t("protein")}</FieldLabel>
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
                      <InputGroupText>{t("grams")}</InputGroupText>
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
                  <FieldLabel htmlFor="fat">{t("fat")}</FieldLabel>
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
                      <InputGroupText>{t("grams")}</InputGroupText>
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
