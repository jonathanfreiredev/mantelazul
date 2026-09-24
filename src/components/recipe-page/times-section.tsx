import type { Difficulty } from "generated/prisma/enums";
import { useTranslations } from "next-intl";

interface TimesSectionProps {
  difficulty: Difficulty;
  preparationTime: number;
  cookingTime: number;
  restingTime: number;
}

export function TimesSection({
  difficulty,
  preparationTime,
  cookingTime,
  restingTime,
}: TimesSectionProps) {
  const t = useTranslations("Recipe");
  const difficultyLabels = useTranslations("Difficulty");

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-4 rounded-lg bg-slate-100 p-5 text-gray-800 sm:gap-8 sm:p-10">
      <div className="flex gap-4 sm:gap-8">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{t("difficulty")}</span>
          <span className="text-muted-foreground text-xs">
            {difficultyLabels(difficulty)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium">{t("preparation")}</span>
          <span className="text-muted-foreground text-xs">
            {t("minutes", { count: preparationTime })}
          </span>
        </div>
      </div>

      <div className="flex gap-4 sm:gap-8">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{t("cooking")}</span>
          <span className="text-muted-foreground text-xs">
            {t("minutes", { count: cookingTime })}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium">{t("resting")}</span>
          <span className="text-muted-foreground text-xs">
            {t("minutes", { count: restingTime })}
          </span>
        </div>
      </div>
    </div>
  );
}
