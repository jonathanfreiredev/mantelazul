"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { Fragment, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { type z } from "zod";
import { cn } from "~/lib/utils";
import { recipeTagsSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/react";
import type { RecipeDto } from "~/types/recipe";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "../ui/combobox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { PlusIcon } from "lucide-react";

interface RecipeTagsFormProps {
  recipe: RecipeDto;
}

export const RecipeTagsForm = ({
  recipe,
  className,
  ...props
}: React.ComponentProps<"div"> & RecipeTagsFormProps) => {
  const t = useTranslations("RecipeForm");
  const [newTagValue, setNewTagValue] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tags] = api.tags.getAll.useSuspenseQuery();

  const router = useRouter();

  const anchor = useComboboxAnchor();

  const updateTagsMutation = api.recipes.updateTags.useMutation();

  const form = useForm<z.infer<typeof recipeTagsSchema>>({
    resolver: zodResolver(recipeTagsSchema),
    defaultValues: {
      tags: recipe.tags.map((recipeTag) => recipeTag.tag.name),
    },
  });

  async function onSubmit(data: z.infer<typeof recipeTagsSchema>) {
    await updateTagsMutation.mutateAsync({
      recipeId: recipe.id,
      tags: data.tags,
    });

    router.push(`/recipes`);
  }

  const dataTags = [...tags.map((tag) => tag.name), ...newTags];

  return (
    <div
      className={cn("flex w-full max-w-125 flex-col gap-6", className)}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("tagsTitle")}</CardTitle>
          <CardDescription>{t("tagsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-tags" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldSet className="mb-5 w-full">
              <FieldGroup className="w-full">
                <Controller
                  name="tags"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="tags">{t("tagsLabel")}</FieldLabel>

                      <Combobox
                        items={dataTags}
                        multiple
                        autoHighlight
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                        onInputValueChange={(value) => {
                          setNewTagValue(value);
                        }}
                        inputValue={newTagValue}
                      >
                        <ComboboxChips ref={anchor} className="w-full">
                          <ComboboxValue>
                            <Fragment>
                              {field.value.map((item: string) => (
                                <ComboboxChip key={item}>#{item}</ComboboxChip>
                              ))}

                              <ComboboxChipsInput
                                placeholder={t("selectTags")}
                              />
                            </Fragment>
                          </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent anchor={anchor}>
                          {newTagValue.trim() !== "" &&
                            !dataTags.includes(newTagValue) && (
                              <Button
                                type="button"
                                className="w-full text-right"
                                variant="ghost"
                                onClick={() => {
                                  setNewTags((prev) => [...prev, newTagValue]);
                                  //trim the new tag and delete the first character if it's a hashtag
                                  const formattedTag = newTagValue
                                    .trim()
                                    .replace(/^#/, "");
                                  field.onChange([
                                    ...field.value,
                                    formattedTag,
                                  ]);
                                  setNewTagValue("");
                                }}
                              >
                                <p className="flex w-full items-center justify-end gap-2">
                                  <PlusIcon /> {t("addTag", { tag: newTagValue })}
                                </p>
                              </Button>
                            )}
                          <ComboboxEmpty>{t("noItems")}</ComboboxEmpty>
                          <ComboboxList>
                            {(item) => (
                              <ComboboxItem key={item} value={item}>
                                #{item}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-tags"
                disabled={form.formState.isSubmitting}
              >
                {t("saveTags")}
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
