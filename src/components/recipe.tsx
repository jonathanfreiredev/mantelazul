"use client";
import { api } from "~/trpc/react";
import Image from "next/image";

interface RecipeProps {
  slug: string;
}

export function Recipe({ slug }: RecipeProps) {
  const [recipe] = api.recipes.getBySlug.useSuspenseQuery({
    slug,
  });

  return (
    <div className="mx-auto flex w-full max-w-230 flex-col items-center px-5 sm:px-10">
      <div className="relative mb-6 h-40 w-full overflow-hidden rounded-lg sm:h-160">
        <Image
          src={recipe?.imageUrl || ""}
          alt={recipe.title}
          fill
          className="object-cover"
        />
      </div>
      <h2 className="mb-4 text-3xl font-bold">{recipe.title}</h2>
    </div>
  );
}
