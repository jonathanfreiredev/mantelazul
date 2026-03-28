import Image from "next/image";
import { categories } from "~/lib/categories-list";
import { capitalize } from "~/lib/utils";

interface CategoryHeroProps {
  currentCategory: string;
}

export function CategoryHero({ currentCategory }: CategoryHeroProps) {
  const category = categories.find((cat) => cat.name === currentCategory);

  if (!category) return null;

  const textColors: Record<string, string> = {
    mains: "text-gray-800",
    starters: "text-white",
    desserts: "text-white",
    drinks: "text-white",
    snacks: "text-white",
    breakfast: "text-white",
    everything: "text-white",
  };

  return (
    <div className="relative flex w-full flex-col py-10">
      <Image
        src={category.imageUrl}
        alt={`${category.name} hero image`}
        fill
        className="absolute -z-10 object-cover"
      />

      <div
        className={`flex flex-col items-center gap-5 sm:p-15 ${textColors[category.name] || "text-gray-800"}`}
      >
        <h2 className="text-5xl text-shadow-lg sm:text-7xl">
          {capitalize(category.name)}
        </h2>
        <p className="max-w-100 text-center text-shadow-lg">
          {category.description}
        </p>
      </div>
    </div>
  );
}
