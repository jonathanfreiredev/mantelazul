"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "~/lib/utils";
import { recipeSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/react";
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
import { Category, Difficulty } from "generated/prisma/enums";
import { toast } from "sonner";

export const CreateRecipeForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const router = useRouter();

  const createRecipeMutation = api.recipes.create.useMutation();

  const form = useForm<z.infer<typeof recipeSchema>>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: "",
      description: "",
      category: Category.MAIN_COURSE,
      difficulty: Difficulty.EASY,
      image: null,
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
  });

  async function onSubmit(data: z.infer<typeof recipeSchema>) {
    const { image, ...restData } = data;

    let imageUrl: string | null = null;

    if (data.image && data.image.preview.startsWith("blob:")) {
      const formData = new FormData();
      formData.append("file", data.image.file);

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
    }

    const recipe = await createRecipeMutation.mutateAsync(
      {
        ...restData,
        imageUrl,
      },
      {
        onError: (error) => {
          toast.error("Failed to create recipe", {
            description: error.message,
            position: "bottom-right",
          });
        },
      },
    );

    if (recipe) {
      router.push(`/recipes/${recipe.slug}/update/ingredients`);
    }
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
            <RecipeForm control={form.control} />

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
