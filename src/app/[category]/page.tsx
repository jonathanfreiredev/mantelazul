import { CategoryHero } from "~/components/category-hero";
import { CategoriesNavbar } from "~/components/home/categories-navbar";

interface MainsPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: MainsPageProps) {
  const { category } = await params;

  return (
    <main className="">
      <CategoriesNavbar currentCategory={category} />
      <CategoryHero currentCategory={category} />
      <div className="grid grid-cols-2 gap-5 p-10 md:grid-cols-3 xl:grid-cols-4">
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="mb-4 h-60 rounded-sm bg-gray-200" />
          ))}
      </div>
    </main>
  );
}
