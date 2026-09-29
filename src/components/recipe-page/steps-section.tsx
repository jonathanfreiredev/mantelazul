import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { formatIngredient } from "~/lib/ingredients";
import { type Locale } from "~/lib/locales";
import { scaledUsageAmount } from "~/lib/step-ingredients";
import type { LocalizedIngredient, LocalizedStep } from "~/types/recipe";

interface StepsSectionProps {
  steps: LocalizedStep[];
  /** The recipe's ingredients, so a step can show the ones it consumes with their amount. */
  ingredients: LocalizedIngredient[];
  servings: number;
  defaultServings: number;
}

export function StepsSection({
  steps,
  ingredients,
  servings,
  defaultServings,
}: StepsSectionProps) {
  const t = useTranslations("Recipe");
  const locale = useLocale() as Locale;

  const ingredientByOrder = new Map(
    ingredients.map((ingredient) => [ingredient.order, ingredient]),
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-2xl font-semibold">{t("steps")}</h3>

      <div className="flex w-full flex-col gap-10">
        {steps.map((step, index) => {
          // In recipe order, not in the order the usages happen to be stored in.
          const usages = [...step.ingredientUsages].sort(
            (a, b) => a.order - b.order,
          );

          // What the step needs, listed before the instruction it belongs to: it reads as the
          // things to have ready for what comes next.
          const amounts = usages
            .map((usage) => {
              const ingredient = ingredientByOrder.get(usage.order);

              // A usage can outlive its ingredient if the recipe changed underneath it; showing
              // nothing is better than showing an amount for a nameless row.
              if (!ingredient) return null;

              return formatIngredient(
                scaledUsageAmount(
                  Number.parseFloat(ingredient.quantity),
                  usage,
                  servings,
                  defaultServings,
                ),
                ingredient.unit,
                ingredient.name,
                locale,
              );
            })
            .filter((amount) => amount !== null);

          return (
            <div key={step.id} className="flex w-full flex-col gap-4">
              <h4 className="text-lg font-medium">
                {t("step", { current: index + 1 })}
              </h4>

              {step.imageUrl && (
                <div className="relative mb-2 aspect-4/3 max-h-100 w-full overflow-hidden rounded-lg">
                  <Image
                    src={step?.imageUrl || ""}
                    alt={t("stepImageAlt", { number: index + 1 })}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {amounts.length > 0 && (
                <p className="text-sm font-light text-gray-500">
                  {amounts.map((amount, index) => (
                    <span key={`${index}-${amount}`}>
                      {index > 0 && (
                        <>
                          {/* A non-breaking space on the left keeps the separator glued to the
                              item before it, and the regular space on the right is where the line
                              is allowed to break. The margin is what gives it its air. */}
                          {"\u00a0"}
                          <span className="mx-1.5">·</span>{" "}
                        </>
                      )}
                      {amount}
                    </span>
                  ))}
                </p>
              )}

              <p className="text-gray-700">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
