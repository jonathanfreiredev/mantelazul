"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Unit } from "generated/prisma/enums";
import { XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { type z } from "zod";
import { breakpoints, useMediaQuery } from "~/hooks/use-media-query";
import { cn } from "~/lib/utils";
import { toLocale } from "~/lib/locales";
import { formatUnit } from "~/lib/units";
import { recipeIngredientsSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/react";
import type { RecipeDto } from "~/types/recipe";
import { RecipeIngredientForm } from "./recipe-ingredient-form";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Field, FieldGroup, FieldSet } from "../ui/field";
import { SortableList } from "../ui/sortable-list";

interface RecipeIngredientsFormProps {
  recipe: RecipeDto;
}

export const RecipeIngredientsForm = ({
  recipe,
  className,
  ...props
}: React.ComponentProps<"div"> & RecipeIngredientsFormProps) => {
  const t = useTranslations("RecipeForm");
  const isDesktop = useMediaQuery(breakpoints.md);
  const router = useRouter();
  const locale = toLocale(useLocale());

  const updateIngredientsMutation = api.recipes.updateIngredients.useMutation();

  const form = useForm<z.infer<typeof recipeIngredientsSchema>>({
    resolver: zodResolver(recipeIngredientsSchema),
    defaultValues: {
      ingredients: recipe.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity.toString(),
        unit: ingredient.unit,
        order: ingredient.order,
      })),
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const watchIngredients = form.watch("ingredients");
  const controlledFields = fields.map((field, index) => {
    return {
      ...field,
      ...watchIngredients[index],
    };
  });

  async function onSubmit(data: z.infer<typeof recipeIngredientsSchema>) {
    const input = {
      recipeId: recipe.id,
      ingredients: data.ingredients,
    };

    await updateIngredientsMutation.mutateAsync(input);

    router.push(`/recipes/${recipe.slug}/update/steps`);
  }

  return (
    <div
      className={cn("flex w-full max-w-125 flex-col gap-6", className)}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("ingredientsTitle")}</CardTitle>
          <CardDescription>{t("ingredientsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-ingredients" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldSet className="mb-5 w-full">
              <FieldGroup className="w-full">
                <SortableList
                  className="flex flex-col gap-2"
                  items={controlledFields}
                  onChange={(newList) => {
                    const updatedFields = newList.map((item, index) => ({
                      ...item,
                      order: index,
                    }));
                    replace(updatedFields);
                  }}
                  renderItem={(field, index) => (
                    <div
                      key={field.id}
                      className="flex w-full cursor-pointer flex-row items-center gap-4"
                    >
                      <Drawer direction={isDesktop ? "right" : "bottom"}>
                        <DrawerTrigger className="flex w-full flex-col items-start gap-2">
                          <p>{field.name}</p>
                          <div className="flex flex-row items-center gap-1 text-gray-700">
                            <p>{field.quantity}</p>
                            <p>{formatUnit(field.unit, locale)}</p>
                          </div>
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle>{t("editIngredient")}</DrawerTitle>
                            <DrawerDescription>
                              {t("editIngredientDescription")}
                            </DrawerDescription>
                          </DrawerHeader>

                          <RecipeIngredientForm
                            index={index}
                            fieldId={field.id}
                            control={form.control}
                          />

                          <DrawerFooter className="mt-4">
                            <DrawerClose asChild>
                              <Button className="w-full">{t("submit")}</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>

                      {controlledFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => remove(index)}
                          aria-label={t("removeIngredient", {
                            name: field.name,
                          })}
                        >
                          <XIcon />
                        </Button>
                      )}
                    </div>
                  )}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      name: t("newIngredient"),
                      quantity: "0",
                      unit: Unit.GRAM,
                      order: fields.length,
                    })
                  }
                >
                  {t("addIngredient")}
                </Button>
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-ingredients"
                disabled={form.formState.isSubmitting}
              >
                {t("saveIngredients")}
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
