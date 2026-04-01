import type { Category, Difficulty } from "generated/prisma/enums";
import { useEffect, useState } from "react";
import type { OrderBy } from "~/components/recipes/recipes";
import { api } from "~/trpc/react";
import type { RecipeDto } from "~/types/recipe";

interface UseGetAllRecipesParams {
  authorId?: string;
  cookbookId?: string;
  orderBy?: OrderBy;
  category?: Category;
  difficulty?: Difficulty;
  search?: string;
  skip?: number;
}

export function useGetAllRecipes({
  authorId,
  cookbookId,
  orderBy,
  category,
  difficulty,
  search,
  skip = 0,
}: UseGetAllRecipesParams) {
  const [allRecipes, setAllRecipes] = useState<RecipeDto[]>([]);
  const [lastSkip, setLastSkip] = useState(skip);

  const { data: resRecipes, ...resQuery } = api.recipes.getAll.useQuery({
    authorId,
    cookbookId,
    orderBy,
    category: category || undefined,
    difficulty: difficulty || undefined,
    search: search || undefined,
    skip,
  });

  useEffect(() => {
    if (!resRecipes) return;

    if (lastSkip > 0 && lastSkip === skip) return;

    if (skip === 0) {
      setAllRecipes(resRecipes.recipes);
    } else {
      setAllRecipes((prev) => [...prev, ...resRecipes.recipes]);
    }

    setLastSkip(skip);
  }, [resRecipes]);

  return {
    ...resQuery,
    data: {
      recipes: allRecipes,
      pagination: resRecipes
        ? {
            total: resRecipes.total,
            skip: resRecipes.skip,
            take: resRecipes.take,
            hasNextPage: resRecipes.hasNextPage,
          }
        : null,
    },
  };
}
