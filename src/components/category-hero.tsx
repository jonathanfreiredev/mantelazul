import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { categories } from "~/lib/categories-list";

interface CategoryHeroProps {
  currentCategory: string;
}

export async function CategoryHero({ currentCategory }: CategoryHeroProps) {
  const category = categories.find((cat) => cat.name === currentCategory);

  if (!category) return null;

  const t = await getTranslations("CategoryPages");

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
        alt={t(`${category.name}.name`)}
        fill
        className="absolute -z-10 object-cover"
      />

      <div
        className={`flex flex-col items-center gap-5 sm:p-15 ${textColors[category.name] || "text-gray-800"}`}
      >
        <h2 className="text-5xl text-shadow-lg sm:text-7xl">
          {t(`${category.name}.name`)}
        </h2>
        <p className="max-w-100 text-center text-shadow-lg">
          {t(`${category.name}.description`)}
        </p>
      </div>
    </div>
  );
}
