"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";
import { cn } from "~/lib/utils";
import { recipeSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/react";
import type { RecipeDto } from "~/types/recipe";
import { RecipeForm } from "./recipe-form";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field } from "../ui/field";

interface UpdateRecipeFormProps {
  recipe: RecipeDto;
}

export const UpdateRecipeForm = ({
  recipe,
  className,
  ...props
}: React.ComponentProps<"div"> & UpdateRecipeFormProps) => {
  const t = useTranslations("RecipeForm");
  const router = useRouter();

  const updateRecipeMutation = api.recipes.update.useMutation();

  const form = useForm<z.infer<typeof recipeSchema>>({
    defaultValues: {
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      difficulty: recipe.difficulty,
      image: recipe.imageUrl
        ? { file: new File([], "image.jpg"), preview: recipe.imageUrl }
        : null,
      defaultServings: recipe.defaultServings,
      preparationTime: recipe.preparationTime,
      cookingTime: recipe.cookingTime,
      restingTime: recipe.restingTime,
      calories: recipe.calories,
      carbohydrates: recipe.carbohydrates,
      protein: recipe.protein,
      fat: recipe.fat,
      tags: recipe.tags.map((recipeTag) => recipeTag.tag.name),
    },
    resolver: async (data, context, options) => {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "validation result",
          await zodResolver(recipeSchema)(data, context, options),
        );
      }
      return zodResolver(recipeSchema)(data, context, options);
    },
  });

  async function onSubmit(data: z.infer<typeof recipeSchema>) {
    const { image, ...restData } = data;

    console.log("Submitting form with data:", data);

    let imageUrl: string | null = recipe.imageUrl;

    if (image && image.preview.startsWith("blob:")) {
      const formData = new FormData();
      formData.append("file", image.file);

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
    } else if (image === null) {
      imageUrl = null;
    }

    const updatedRecipe = await updateRecipeMutation.mutateAsync(
      {
        id: recipe.id,
        recipe: {
          ...restData,
          imageUrl,
        },
      },
      {
        onError: () => {
          toast.error(t("updateFailed"), {
            position: "bottom-right",
          });
        },
      },
    );

    if (updatedRecipe) {
      router.push(`/recipes/${updatedRecipe.slug}/update/ingredients`);
    }
  }

  return (
    <div
      className={cn("flex w-full max-w-125 flex-col gap-6", className)}
      {...props}
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("updateTitle")}</CardTitle>
          <CardDescription>{t("updateDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-create-recipe" onSubmit={form.handleSubmit(onSubmit)}>
            <RecipeForm control={form.control} />

            <Field>
              <Button
                type="submit"
                form="form-create-recipe"
                disabled={form.formState.isSubmitting}
              >
                {t("updateButton")}
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
