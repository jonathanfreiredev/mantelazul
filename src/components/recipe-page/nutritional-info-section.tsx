import { useTranslations } from "next-intl";

interface NutritionalInfoSectionProps {
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
}

export function NutritionalInfoSection({
  calories,
  carbohydrates,
  protein,
  fat,
}: NutritionalInfoSectionProps) {
  const t = useTranslations("Recipe");

  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-2xl font-semibold">{t("nutritionalInfo")}</h3>
      <div className="flex w-full flex-wrap items-center justify-center gap-4 rounded-lg bg-slate-100 p-5 text-gray-800 sm:gap-8 sm:p-10">
        <div className="flex gap-4 sm:gap-8">
          <div className="flex flex-col gap-1">
            <span className="font-medium">{t("kcal")}</span>
            <span className="text-muted-foreground text-xs">{calories}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium">{t("carbs")}</span>
            <span className="text-muted-foreground text-xs">
              {carbohydrates} g
            </span>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-8">
          <div className="flex flex-col gap-1">
            <span className="font-medium">{t("protein")}</span>
            <span className="text-muted-foreground text-xs">{protein} g</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium">{t("fat")}</span>
            <span className="text-muted-foreground text-xs">{fat} g</span>
          </div>
        </div>
      </div>
    </div>
  );
}
