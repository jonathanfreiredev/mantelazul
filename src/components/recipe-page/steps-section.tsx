import Image from "next/image";
import { useTranslations } from "next-intl";
import type { LocalizedStep } from "~/types/recipe";

interface StepsSectionProps {
  steps: LocalizedStep[];
}

export function StepsSection({ steps }: StepsSectionProps) {
  const t = useTranslations("Recipe");

  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-2xl font-semibold">{t("steps")}</h3>

      <div className="flex w-full flex-col gap-10">
        {steps.map((step) => (
          <div key={step.id} className="flex w-full flex-col gap-4">
            <h4 className="text-lg font-medium">
              {t("stepCounter", {
                current: step.order + 1,
                total: steps.length,
              })}
            </h4>

            {step.imageUrl && (
              <div className="relative mb-2 aspect-4/3 max-h-100 w-full overflow-hidden rounded-lg">
                <Image
                  src={step?.imageUrl || ""}
                  alt={t("stepImageAlt", { number: step.order + 1 })}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <p className="text-gray-700">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
