"use client";
import { api } from "~/trpc/react";
import Image from "next/image";
import { RecipeLikeButton } from "../recipe-like-button";
import { ShareButton } from "../share-button";
import { Separator } from "../ui/separator";
import { AuthorSection } from "./author-section";
import { TimesSection } from "./times-section";
import { IngredientsSection } from "./ingredients-section";
import { StepsSection } from "./steps-section";
import { NutritionalInfoSection } from "./nutritional-info-section";

interface RecipeProps {
  slug: string;
}

export function Recipe({ slug }: RecipeProps) {
  const [recipe] = api.recipes.getBySlug.useSuspenseQuery({
    slug,
  });

  return (
    <div className="mx-auto flex w-full max-w-230 flex-col items-center sm:px-10">
      {recipe.imageUrl && (
        <div className="relative aspect-4/3 w-full overflow-hidden sm:rounded-lg">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="my-6 flex flex-col items-center justify-between p-5 sm:p-0">
        <h2 className="nowrap line-clamp-2 text-3xl font-bold">
          {recipe.title}
        </h2>

        <div className="mt-6 flex items-center justify-center gap-8">
          <RecipeLikeButton
            recipeId={recipe.id}
            className="text-md text-gray-800"
            size="xl"
            positionIcon="top"
          />

          <ShareButton
            recipeSlug={recipe.slug}
            className="text-md text-gray-800"
            size="xl"
            positionIcon="top"
          />
        </div>

        {recipe.authorId && (
          <>
            <Separator className="my-6 w-full" />
            <AuthorSection authorId={recipe.authorId} />
          </>
        )}

        <Separator className="my-6 w-full" />

        <TimesSection
          difficulty={recipe.difficulty}
          preparationTime={recipe.preparationTime}
          cookingTime={recipe.cookingTime}
          restingTime={recipe.restingTime}
        />

        <Separator className="my-6 w-full" />

        <IngredientsSection
          defaultServings={recipe.defaultServings}
          ingredients={recipe.ingredients}
        />

        <Separator className="my-6 w-full" />

        <NutritionalInfoSection
          calories={recipe.calories}
          carbohydrates={recipe.carbohydrates}
          protein={recipe.protein}
          fat={recipe.fat}
        />

        <Separator className="my-6 w-full" />

        <StepsSection steps={recipe.steps} />
      </div>
    </div>
  );
}
