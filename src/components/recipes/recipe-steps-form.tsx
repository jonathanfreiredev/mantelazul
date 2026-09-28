"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { type z } from "zod";
import { breakpoints, useMediaQuery } from "~/hooks/use-media-query";
import {
  assignmentByIngredient,
  type IngredientUsage,
} from "~/lib/step-ingredients";
import { cn } from "~/lib/utils";
import { recipeStepsSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/react";
import type { RecipeDto } from "~/types/recipe";
import { RecipeStepForm } from "./recipe-step-form";
import { toast } from "sonner";
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
import Image from "next/image";

interface RecipeStepsFormProps {
  recipe: RecipeDto;
}

export const RecipeStepsForm = ({
  recipe,
  className,
  ...props
}: React.ComponentProps<"div"> & RecipeStepsFormProps) => {
  const t = useTranslations("RecipeForm");
  const isDesktop = useMediaQuery(breakpoints.md);
  const router = useRouter();

  const updateStepsMutation = api.recipes.updateSteps.useMutation();
  const inferIngredientsMutation =
    api.recipes.inferStepIngredients.useMutation();

  const form = useForm<z.infer<typeof recipeStepsSchema>>({
    resolver: zodResolver(recipeStepsSchema),
    defaultValues: {
      steps: recipe.steps.map((step) => ({
        id: step.id,
        description: step.description,
        imageUrl: step.imageUrl,
        order: step.order,
        ingredientUsages: step.ingredientUsages,
        image: step.imageUrl
          ? { file: new File([], "image.jpg"), preview: step.imageUrl }
          : null,
      })),
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const watchSteps = form.watch("steps");
  const controlledFields = fields.map((field, index) => {
    return {
      ...field,
      ...watchSteps[index],
    };
  });

  // What every step takes from each ingredient so far. Watched, not read once, so the "usado X de
  // Y" hint keeps up while the author edits.
  const assignedByOrder = assignmentByIngredient(
    controlledFields.map((field) => field.ingredientUsages ?? []),
  );

  const ingredientNameByOrder = new Map(
    recipe.ingredients.map((ingredient) => [ingredient.order, ingredient.name]),
  );

  /** Fills every step with a proposal from the model, for the author to review and correct. */
  async function suggestIngredients() {
    try {
      const suggestions = await inferIngredientsMutation.mutateAsync({
        recipeId: recipe.id,
      });

      const usageByStepOrder = new Map(
        suggestions.map((suggestion) => [
          suggestion.stepOrder,
          suggestion.ingredientUsages,
        ]),
      );

      replace(
        controlledFields.map((field) => ({
          ...field,
          ingredientUsages: usageByStepOrder.get(field.order) ?? [],
        })),
      );
    } catch {
      toast.error(t("suggestIngredientsFailed"));
    }
  }

  async function onSubmit(data: z.infer<typeof recipeStepsSchema>) {
    const steps: {
      description: string;
      order: number;
      imageUrl: string | null;
      ingredientUsages: IngredientUsage[];
    }[] = [];

    for (const step of data.steps) {
      let imageUrl: string | null = step.imageUrl;

      if (step.image && step.image.preview.startsWith("blob:")) {
        const formData = new FormData();
        formData.append("file", step.image.file);

        const response = await fetch("/api/images/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          console.error("Image upload failed");
          return;
        }

        const resImage: { url: string } = await response.json();

        imageUrl = resImage.url;
      } else if (step.image === null) {
        imageUrl = null;
      }

      steps.push({
        description: step.description,
        order: step.order,
        imageUrl,
        ingredientUsages: step.ingredientUsages,
      });
    }

    const input = {
      recipeId: recipe.id,
      steps,
    };

    await updateStepsMutation.mutateAsync(input);

    router.push(`/recipes/${recipe.slug}/update/tags`);
  }

  return (
    <div
      className={cn("flex w-full max-w-125 flex-col gap-6", className)}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("stepsTitle")}</CardTitle>
          <CardDescription>{t("stepsDescription")}</CardDescription>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mx-auto mt-2"
            disabled={inferIngredientsMutation.isPending}
            onClick={suggestIngredients}
          >
            {inferIngredientsMutation.isPending
              ? t("suggestingIngredients")
              : t("suggestIngredients")}
          </Button>
        </CardHeader>
        <CardContent>
          <form id="form-steps" onSubmit={form.handleSubmit(onSubmit)}>
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
                          <div className="flex items-center gap-4">
                            {field.image && (
                              <div className="relative flex h-15 w-20 items-center justify-center rounded-md">
                                <Image
                                  src={field.image.preview}
                                  alt={t("stepImage")}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                              </div>
                            )}
                            <p>{field.description}</p>
                          </div>

                          {field.ingredientUsages.length > 0 && (
                            <p className="text-muted-foreground text-xs">
                              {field.ingredientUsages
                                .map((usage) =>
                                  ingredientNameByOrder.get(usage.order),
                                )
                                .filter((name) => name !== undefined)
                                .join(" · ")}
                            </p>
                          )}
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle>{t("editStep")}</DrawerTitle>
                            <DrawerDescription>
                              {t("editStepDescription")}
                            </DrawerDescription>
                          </DrawerHeader>

                          <RecipeStepForm
                            index={index}
                            fieldId={field.id}
                            control={form.control}
                            ingredients={recipe.ingredients}
                            assignedByOrder={assignedByOrder}
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
                          aria-label={t("removeStep", {
                            name: field.description,
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
                      description: t("newStep"),
                      imageUrl: null,
                      order: fields.length,
                      ingredientUsages: [],
                      image: null,
                    })
                  }
                >
                  {t("addStep")}
                </Button>
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-steps"
                disabled={form.formState.isSubmitting}
              >
                {t("saveSteps")}
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
