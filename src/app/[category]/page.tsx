import { Category } from "generated/prisma/enums";
import { CategoryHero } from "~/components/category-hero";
import { CategoriesNavbar } from "~/components/home/categories-navbar";
import { Recipes } from "~/components/recipes";
import { api } from "~/trpc/server";

interface MainsPageProps {
  params: Promise<{ category: string }>;
}

export const categoryMapping = {
  mains: Category.MAIN_COURSE,
  starters: Category.STARTER,
  desserts: Category.DESSERT,
  drinks: Category.DRINK,
  snacks: Category.SNACK,
  breakfast: Category.BREAKFAST,
  everything: undefined,
};

export default async function CategoryPage({ params }: MainsPageProps) {
  const { category } = await params;

  void api.recipes.getAll.prefetch({
    category: categoryMapping[category as keyof typeof categoryMapping],
    orderBy: "createdAt",
    skip: 0,
  });

  return (
    <>
      <CategoriesNavbar currentCategory={category} />
      <CategoryHero currentCategory={category} />

      <div className="flex w-full px-5 sm:px-10">
        <Recipes
          categoryPage={
            categoryMapping[category as keyof typeof categoryMapping]
          }
          isEditable={false}
        />
      </div>
    </>
  );
}
