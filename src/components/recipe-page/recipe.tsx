"use client";
import { LanguagesIcon, SparklesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toLocale } from "~/lib/locales";
import { api } from "~/trpc/react";
import Image from "next/image";
import { RecipeLikeButton } from "../recipes/recipe-like-button";
import { ShareButton } from "../recipes/share-button";
import { Separator } from "../ui/separator";
import { AuthorSection } from "./author-section";
import { TimesSection } from "./times-section";
import { IngredientsSection } from "./ingredients-section";
import { StepsSection } from "./steps-section";
import { NutritionalInfoSection } from "./nutritional-info-section";
import { authClient } from "~/server/better-auth/client";
import { EditRecipeButton } from "../recipes/edit-recipe-button";
import { TagsSection } from "./tags-section";
import { SaveRecipeButton } from "../recipes/save-recipe-button";
import { AddToCalendarButton } from "../recipes/add-to-calendar-button";

interface RecipeProps {
  slug: string;
}

export function Recipe({ slug }: RecipeProps) {
  const locale = useLocale();
  const t = useTranslations("Recipe");
  const [recipe] = api.recipes.getBySlug.useSuspenseQuery({
    slug,
    locale: toLocale(locale),
  });

  // The recipe itself is public, so it renders before the session is known: the session only
  // decides which actions are offered, and it is still loading when the server renders this.
  // Bailing out here would leave the HTML empty and a crawler with nothing to read.
  const { data } = authClient.useSession();

  const isLoggedIn = !!data?.session;
  const isOriginalLanguage =
    recipe.resolvedLocale === toLocale(recipe.sourceLocale);

  // The servings live here rather than inside the ingredient list, because the steps show the
  // amount each of them consumes and both have to scale by the same factor.
  const [servings, setServings] = useState(recipe.defaultServings);

  return (
    <div className="mx-auto flex w-full max-w-230 flex-col items-center sm:px-10">
      {recipe.imageUrl && (
        <div className="relative aspect-4/3 w-full overflow-hidden sm:rounded-lg">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            // The photo is the largest thing on the page, so it is the element the browser
            // measures for LCP: preloading it is worth more than a lazy load here.
            priority
            className="object-cover"
          />
        </div>
      )}
      <div className="my-6 flex flex-col items-center justify-between p-5 sm:p-0">
        <h2 className="nowrap line-clamp-2 text-3xl font-bold">
          {recipe.title}
        </h2>

        <div className="border-border bg-muted/50 text-muted-foreground mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
          {isOriginalLanguage ? (
            <>
              <LanguagesIcon className="size-3.5" />
              {t("originalLanguage")}
            </>
          ) : (
            <>
              <SparklesIcon className="size-3.5" />
              {t("autoTranslated")}
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-8">
          <RecipeLikeButton
            recipeId={recipe.id}
            className="text-md text-gray-800"
            size="xl"
            positionIcon="top"
            isLoggedIn={isLoggedIn}
          />

          <ShareButton
            recipeSlug={recipe.slug}
            className="text-md text-gray-800"
            size="xl"
            positionIcon="top"
          />

          <SaveRecipeButton
            recipeId={recipe.id}
            className="text-md text-gray-800"
            size="xl"
            positionIcon="top"
            isLoggedIn={isLoggedIn}
          />

          <AddToCalendarButton
            recipeId={recipe.id}
            defaultServings={recipe.defaultServings}
            className="text-md text-gray-800"
            size="xl"
            isLoggedIn={isLoggedIn}
          />

          {isLoggedIn && data.user.id === recipe.authorId && (
            <EditRecipeButton
              recipeSlug={recipe.slug}
              className="text-md text-gray-800"
              size="xl"
              positionIcon="top"
            />
          )}
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
          servings={servings}
          onServingsChange={setServings}
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

        <StepsSection
          steps={recipe.steps}
          ingredients={recipe.ingredients}
          servings={servings}
          defaultServings={recipe.defaultServings}
        />

        {recipe.tags.length > 0 && (
          <>
            <Separator className="my-6 w-full" />

            <TagsSection tags={recipe.tags.map((recipeTag) => recipeTag.tag)} />
          </>
        )}
      </div>
    </div>
  );
}
