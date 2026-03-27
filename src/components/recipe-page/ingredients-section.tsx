import type { Ingredient } from "generated/prisma/client";
import { useState } from "react";
import type { DecimalToString } from "~/types/decimal-to-string";
import { Button } from "../ui/button";
import { formatQuantity } from "~/lib/utils";

interface IngredientsSectionProps {
  defaultServings: number;
  ingredients: DecimalToString<Ingredient>[];
}

export function IngredientsSection({
  defaultServings,
  ingredients,
}: IngredientsSectionProps) {
  const [servings, setServings] = useState(defaultServings);

  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-2xl font-semibold">Ingredients</h3>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => setServings((prev) => Math.max(prev - 1, 1))}
        >
          -
        </Button>
        <span className="text-lg text-gray-900">{servings}</span>
        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => setServings((prev) => prev + 1)}
        >
          +
        </Button>
        <span className="text-md text-gray-500">Servings</span>
      </div>

      <ul className="list-none space-y-1">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id} className="flex gap-5 text-gray-700">
            <span className="text-right font-medium">
              {formatQuantity(
                parseFloat(ingredient.quantity) * (servings / defaultServings),
              )}{" "}
              {ingredient.unit.toLowerCase()}
            </span>

            <span className="flex-1">{ingredient.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
