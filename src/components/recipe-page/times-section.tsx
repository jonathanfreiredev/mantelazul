import type { Difficulty } from "generated/prisma/enums";
import { Separator } from "../ui/separator";

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
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-4 rounded-lg bg-slate-100 p-5 text-gray-800 sm:gap-8 sm:p-10">
      <div className="flex gap-4 sm:gap-8">
        <div className="flex flex-col gap-1">
          <span className="font-medium">Difficulty</span>
          <span className="text-muted-foreground text-xs">{difficulty}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium">Preparation</span>
          <span className="text-muted-foreground text-xs">
            {preparationTime} Min.
          </span>
        </div>
      </div>

      <div className="flex gap-4 sm:gap-8">
        <div className="flex flex-col gap-1">
          <span className="font-medium">Cooking</span>
          <span className="text-muted-foreground text-xs">
            {cookingTime} Min.
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium">Resting</span>
          <span className="text-muted-foreground text-xs">
            {restingTime} Min.
          </span>
        </div>
      </div>
    </div>
  );
}
