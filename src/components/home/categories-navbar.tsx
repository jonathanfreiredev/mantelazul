import Link from "next/link";
import { categories } from "~/lib/categories-list";
import { capitalize } from "~/lib/utils";
import { Button } from "../ui/button";

interface CategoriesNavbarProps {
  currentCategory: string;
}

export function CategoriesNavbar({ currentCategory }: CategoriesNavbarProps) {
  return (
    <div className="h-12 border-b bg-zinc-100 sm:h-20 dark:bg-zinc-300">
      <div className="no-scrollbar flex h-full items-center overflow-x-auto px-2">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.name;

          return (
            <Link
              key={cat.name}
              href={cat.href}
              className={`flex h-full items-center px-4 text-sm whitespace-nowrap sm:text-base ${
                isActive
                  ? "border-b-3 border-black font-semibold dark:border-white dark:text-shadow-xs"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <p className="text-center">{capitalize(cat.name)}</p>
            </Link>
          );
        })}

        <Button variant="default" className="ml-auto">
          New Recipe
        </Button>
      </div>
    </div>
  );
}
