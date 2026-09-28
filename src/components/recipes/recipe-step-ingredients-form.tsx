import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { formatIngredientAmount } from "~/lib/ingredients";
import { type Locale } from "~/lib/locales";
import {
  shareFromAmount,
  usageShare,
  type IngredientUsage,
  type Share,
} from "~/lib/step-ingredients";
import type { LocalizedIngredient } from "~/types/recipe";
import { Button } from "../ui/button";
import { Field, FieldGroup } from "../ui/field";
import { Input } from "../ui/input";

/**
 * The shares offered as one-tap shortcuts. Quarters are as far as a recipe splits an ingredient in
 * practice, and anything rarer goes through the amount field.
 */
const SHARE_SHORTCUTS: { share: Share; label: string }[] = [
  { share: { part: 1, of: 2 }, label: "½" },
  { share: { part: 1, of: 3 }, label: "⅓" },
  { share: { part: 2, of: 3 }, label: "⅔" },
  { share: { part: 1, of: 4 }, label: "¼" },
  { share: { part: 3, of: 4 }, label: "¾" },
];

const WHOLE: Share = { part: 1, of: 1 };

interface RecipeStepIngredientsFormProps {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the form values type lives with the caller; this component only wires fields through to react-hook-form.
  control: any;
  /** The recipe's ingredients, so the step can be told which of them it consumes. */
  ingredients: LocalizedIngredient[];
  /** What every step takes from each ingredient, keyed by ingredient order. */
  assignedByOrder: Map<number, Share>;
}

/**
 * The ingredients a step consumes, with the share of each one.
 *
 * Ticking an ingredient means the step uses all of it, which is the common case and costs one tap.
 * The shortcuts and the amount field only appear afterwards, for the steps that take a part.
 */
export function RecipeStepIngredientsForm({
  index,
  control,
  ingredients,
  assignedByOrder,
}: RecipeStepIngredientsFormProps) {
  const t = useTranslations("RecipeForm");

  return (
    <Controller
      name={`steps.${index}.ingredientUsages`}
      control={control}
      render={({ field }) => {
        const usages = field.value as IngredientUsage[];

        const setShare = (order: number, share: Share | null) => {
          const others = usages.filter((usage) => usage.order !== order);

          field.onChange(
            share
              ? [...others, { order, part: share.part, of: share.of }].sort(
                  (a, b) => a.order - b.order,
                )
              : others,
          );
        };

        return (
          <FieldGroup className="flex w-full flex-col gap-3 px-6 py-2">
            <Field>
              <p className="text-sm font-medium">{t("stepIngredientsTitle")}</p>
              <p className="text-muted-foreground text-xs">
                {t("stepIngredientsDescription")}
              </p>
            </Field>

            {ingredients.map((ingredient) => (
              <StepIngredientRow
                key={ingredient.order}
                ingredient={ingredient}
                usage={usages.find(
                  (candidate) => candidate.order === ingredient.order,
                )}
                assigned={assignedByOrder.get(ingredient.order)}
                onShareChange={(share) => setShare(ingredient.order, share)}
              />
            ))}
          </FieldGroup>
        );
      }}
    />
  );
}

interface StepIngredientRowProps {
  ingredient: LocalizedIngredient;
  /** What this step takes from the ingredient, or undefined when it takes none of it. */
  usage: IngredientUsage | undefined;
  /** What every step takes from it, so the row can say how much is left. */
  assigned: Share | undefined;
  onShareChange: (share: Share | null) => void;
}

/**
 * One ingredient of a step, with the share of it the step consumes.
 *
 * It is a component of its own because the amount field needs somewhere to keep what is being
 * typed. The value it shows comes from the fraction, so without a draft of its own every keystroke
 * would be replaced by the fraction that keystroke had just produced, and the field would refuse
 * to be edited: clearing it would bring the old number back, and typing after a number would
 * append to it.
 */
function StepIngredientRow({
  ingredient,
  usage,
  assigned,
  onShareChange,
}: StepIngredientRowProps) {
  const t = useTranslations("RecipeForm");
  const locale = useLocale() as Locale;

  /** What is in the amount field while it is being edited; null when it shows the stored amount. */
  const [draft, setDraft] = useState<string | null>(null);

  const quantity = Number.parseFloat(ingredient.quantity);
  const total = formatIngredientAmount(
    ingredient.quantity,
    ingredient.unit,
    locale,
  );
  const amount = usage ? Number((quantity * usageShare(usage)).toFixed(3)) : 0;

  // A share adds up to a fraction of the ingredient's amount. It is exact, so the editor can say
  // "completo" only when the steps really do account for all of it.
  const usedAmount = assigned ? quantity * (assigned.part / assigned.of) : 0;
  const used = formatIngredientAmount(usedAmount, ingredient.unit, locale);
  const left = formatIngredientAmount(
    quantity - usedAmount,
    ingredient.unit,
    locale,
  );

  /** Applies a share picked with the controls, dropping whatever was half-typed in the field. */
  function select(share: Share | null) {
    setDraft(null);
    onShareChange(share);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={usage !== undefined}
            onChange={(event) => select(event.target.checked ? WHOLE : null)}
          />
          {ingredient.name}
        </label>

        {total && (
          <span className="text-muted-foreground text-xs">
            {t("usageTotal", { amount: total })}
          </span>
        )}
      </div>

      {usage && total && (
        <>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant={
                usage.part === 1 && usage.of === 1 ? "default" : "outline"
              }
              onClick={() => select(WHOLE)}
            >
              {t("usageWhole")}
            </Button>

            {SHARE_SHORTCUTS.map((shortcut) => (
              <Button
                key={shortcut.label}
                type="button"
                size="sm"
                aria-label={`${shortcut.share.part}/${shortcut.share.of}`}
                variant={
                  usage.part === shortcut.share.part &&
                  usage.of === shortcut.share.of
                    ? "default"
                    : "outline"
                }
                onClick={() => select(shortcut.share)}
              >
                {shortcut.label}
              </Button>
            ))}

            <Input
              type="number"
              aria-label={t("usageAmount")}
              className="w-24"
              min={0}
              max={quantity}
              // The spinner moves in whole units: an ingredient is measured in ones and grams,
              // never in thousandths of the amount a step happens to take.
              step="any"
              value={draft ?? amount}
              onChange={(event) => {
                const typed = event.target.value;
                setDraft(typed);

                // An empty or half-typed field keeps the text as it is and changes nothing: the
                // value is only stored once there is a number to store.
                const parsed = Number.parseFloat(typed);
                if (!Number.isFinite(parsed)) return;

                const share = shareFromAmount(parsed, quantity);
                if (share) onShareChange(share);
              }}
              // Leaving the field throws the draft away and falls back to the stored fraction, so
              // an impossible amount ends up showing the last valid one.
              onBlur={() => setDraft(null)}
            />
          </div>

          <p className="text-muted-foreground text-xs">
            {t("usageAssigned", {
              used: used ?? "0",
              total: total,
            })}
            {assigned && assigned.part > assigned.of
              ? ` · ${t("usageOver")}`
              : left
                ? ` · ${t("usageLeft", { amount: left })}`
                : ` · ${t("usageComplete")}`}
          </p>
        </>
      )}
    </div>
  );
}
