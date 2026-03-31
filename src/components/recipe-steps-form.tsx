"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { breakpoints, useMediaQuery } from "~/hooks/use-media-query";
import { cn } from "~/lib/utils";
import { recipeStepsSchema } from "~/server/api/routers/recipes/validation";
import { api } from "~/trpc/react";
import type { RecipeDto } from "~/types/recipe";
import { RecipeStepForm } from "./recipe-step-form";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Field, FieldGroup, FieldSet } from "./ui/field";
import { SortableList } from "./ui/sortable-list";
import Image from "next/image";

interface RecipeStepsFormProps {
  recipe: RecipeDto;
}

export const RecipeStepsForm = ({
  recipe,
  className,
  ...props
}: React.ComponentProps<"div"> & RecipeStepsFormProps) => {
  const isDesktop = useMediaQuery(breakpoints.md);
  const router = useRouter();

  const updateStepsMutation = api.recipes.updateSteps.useMutation();

  const form = useForm<z.infer<typeof recipeStepsSchema>>({
    resolver: zodResolver(recipeStepsSchema),
    defaultValues: {
      steps: recipe.steps.map((step) => ({
        id: step.id,
        description: step.description,
        imageUrl: step.imageUrl,
        order: step.order,
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

  async function onSubmit(data: z.infer<typeof recipeStepsSchema>) {
    const steps: {
      description: string;
      order: number;
      imageUrl: string | null;
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
      });
    }

    const input = {
      recipeId: recipe.id,
      steps,
    };

    console.log("Submitting steps:", input);

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
          <CardTitle className="text-xl">Steps</CardTitle>
          <CardDescription>
            Update the steps for your recipe. You can add, edit, reorder, or
            remove steps as needed to ensure your recipe is clear and easy to
            follow.
          </CardDescription>
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
                                  alt={`Step ${index + 1} image`}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                              </div>
                            )}
                            <p>{field.description}</p>
                          </div>
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle>Edit Step</DrawerTitle>
                            <DrawerDescription>
                              Make changes to your step here. Click save when
                              you're done.
                            </DrawerDescription>
                          </DrawerHeader>

                          <RecipeStepForm
                            index={index}
                            fieldId={field.id}
                            control={form.control}
                          />

                          <DrawerFooter className="mt-4">
                            <DrawerClose asChild>
                              <Button className="w-full">Submit</Button>
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
                          aria-label={`Remove ingredient ${field.description}`}
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
                      description: "New Step",
                      imageUrl: null,
                      order: fields.length,
                      image: null,
                    })
                  }
                >
                  Add Step
                </Button>
              </FieldGroup>
            </FieldSet>

            <Field>
              <Button
                type="submit"
                form="form-steps"
                disabled={form.formState.isSubmitting}
              >
                Save Steps
              </Button>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
