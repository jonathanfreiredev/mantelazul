"use client";

import type { Category, Difficulty } from "generated/prisma/enums";
import { ClockIcon, HeartIcon, UtensilsCrossedIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { ToolResultCard } from "./tool-result-card";
import { type ToolPart } from "./tool-part";

/**
 * One recipe as the list tools return it. Search hits and favourites carry the same fields, so a
 * single shape covers both.
 */
interface RecipeListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  tags: string[];
  likesCount: number;
  totalTime: number;
  imageUrl: string | null;
}

interface RecipeListToolProps {
  part: ToolPart<"searchRecipes"> | ToolPart<"getFavouriteRecipes">;
  /** Called once the user navigates away, so the drawer can close. */
  onNavigate: () => void;
}

/** Tags beyond this many are summarised as a count, so one recipe cannot flood the card. */
const MAX_VISIBLE_TAGS = 3;

/**
 * Result of 'searchRecipes' and 'getFavouriteRecipes': the recipes as compact cards.
 *
 * The agent used to write these lists out as prose, which read as a wall of text with no clear
 * start for each recipe. The cards carry the same facts in a shape the eye can scan, and they
 * hold up without a picture: most of these recipes are only suggestions, so they have no image.
 */
export function RecipeListTool({ part, onNavigate }: RecipeListToolProps) {
  const tList = useTranslations("RecipesList");
  const tRecipe = useTranslations("Recipe");
  const tCategories = useTranslations("Categories");
  const tDifficulty = useTranslations("Difficulty");

  if (part.state !== "output-available") return null;
  if (!part.output.success) return null;

  const recipes: RecipeListItem[] = part.output.recipes;
  if (recipes.length === 0) return null;

  return (
    <ToolResultCard>
      <p className="text-xs font-medium opacity-70">
        {tList("recipeCount", { count: recipes.length })}
      </p>

      <ul className="flex flex-col gap-1">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <Link
              href={`/recipes/${recipe.slug}`}
              onClick={onNavigate}
              className="hover:bg-background/60 -mx-2 flex items-start gap-3 rounded-md p-2 transition-colors"
            >
              <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-300">
                {recipe.imageUrl ? (
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <UtensilsCrossedIcon className="size-5 opacity-40" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 font-medium">{recipe.title}</span>

                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs opacity-70">
                  <span>{tCategories(recipe.category as Category)}</span>
                  <span aria-hidden>·</span>
                  <span>{tDifficulty(recipe.difficulty as Difficulty)}</span>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    {tRecipe("minutes", { count: recipe.totalTime })}
                  </span>
                  {recipe.likesCount > 0 && (
                    <span className="flex items-center gap-1">
                      <HeartIcon className="size-3" />
                      {recipe.likesCount}
                    </span>
                  )}
                </span>

                {recipe.tags.length > 0 && (
                  <span className="mt-0.5 block truncate text-[11px] opacity-60">
                    {recipe.tags.slice(0, MAX_VISIBLE_TAGS).join(" · ")}
                    {recipe.tags.length > MAX_VISIBLE_TAGS &&
                      ` +${recipe.tags.length - MAX_VISIBLE_TAGS}`}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ToolResultCard>
  );
}
