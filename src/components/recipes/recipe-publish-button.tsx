"use client";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Field, FieldLabel } from "../ui/field";
import { Switch } from "../ui/switch";

interface RecipePublishButtonProps {
  recipeId: string;
  className?: string;
}

export function RecipePublishButton({
  recipeId,
  className,
}: RecipePublishButtonProps) {
  const utils = api.useUtils();

  const togglePublicationStatus =
    api.recipes.tooglePublicationStatus.useMutation({
      onMutate: async () => {
        await utils.recipes.getPublicationStatus.cancel();

        const prev = utils.recipes.getPublicationStatus.getData({ recipeId });

        utils.recipes.getPublicationStatus.setData({ recipeId }, (old) => ({
          published: !old?.published,
        }));

        return { prev };
      },
      onError: (_err, _vars, context) => {
        if (context?.prev) {
          utils.recipes.getPublicationStatus.setData(
            { recipeId },
            context.prev,
          );
        }
      },
      onSettled: () => {
        utils.recipes.getPublicationStatus.invalidate();
      },
    });

  const { data: recipeData, isLoading: likeLoading } =
    api.recipes.getPublicationStatus.useQuery({ recipeId });

  if (likeLoading || !recipeData) return null;

  const published = recipeData.published;

  return (
    <Field orientation="horizontal" className={cn("w-fit", className)}>
      <FieldLabel htmlFor="2fa">Published</FieldLabel>
      <Switch
        id="2fa"
        checked={published}
        onClick={async (e) => {
          e.preventDefault();

          if (togglePublicationStatus.isPending) return;

          togglePublicationStatus.mutate({ recipeId });
        }}
      />
    </Field>
  );
}
