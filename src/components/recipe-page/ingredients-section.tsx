import { useLocale, useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { formatIngredientAmount } from "~/lib/ingredients";
import { type Locale } from "~/lib/locales";
import { servingsRatio } from "~/lib/step-ingredients";
import type { LocalizedIngredient } from "~/types/recipe";

interface IngredientsSectionProps {
  defaultServings: number;
  /** Servings the cook has dialled in. Shared with the steps, so both scale together. */
  servings: number;
  onServingsChange: (servings: number) => void;
  ingredients: LocalizedIngredient[];
}

export function IngredientsSection({
  defaultServings,
  servings,
  onServingsChange,
  ingredients,
}: IngredientsSectionProps) {
  const t = useTranslations("Recipe");
  const locale = useLocale() as Locale;

  const ratio = servingsRatio(servings, defaultServings);

  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-2xl font-semibold">{t("ingredients")}</h3>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => onServingsChange(Math.max(servings - 1, 1))}
        >
          -
        </Button>
        <span className="text-lg text-gray-900">{servings}</span>
        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => onServingsChange(servings + 1)}
        >
          +
        </Button>
        <span className="text-md text-gray-500">{t("servings")}</span>
      </div>

      <ul className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1">
        {ingredients.map((ingredient) => {
          // An ingredient with no amount of its own (salt, pepper, "to taste") shows its name
          // alone: there is nothing to scale and "0 g" is not something anyone wants to read.
          const amount = formatIngredientAmount(
            Number.parseFloat(ingredient.quantity) * ratio,
            ingredient.unit,
            locale,
          );

          return (
            // Subgrid keeps the two columns aligned across every row, so the names all start at
            // the same place however wide their amounts are.
            <li
              key={ingredient.id}
              className="col-span-2 grid grid-cols-subgrid text-gray-700"
            >
              <span className="text-right font-medium">{amount}</span>
              <span>{ingredient.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
