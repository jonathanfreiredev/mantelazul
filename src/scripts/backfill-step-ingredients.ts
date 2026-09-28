import "dotenv/config";
import type { Prisma } from "generated/prisma/client";
import {
  parseIngredientUsages,
  sumShares,
  type IngredientUsage,
} from "~/lib/step-ingredients";
import { db } from "~/server/db";
import { inferStepIngredients } from "~/server/recipes/infer-step-ingredients";
import { readSourceContent } from "~/server/translations/source";

/**
 * Works out which ingredients each step of every recipe consumes, one model call per recipe.
 *
 * Run once after the ingredient-usages migration, and again whenever you want proposals for the
 * steps that are still empty:
 *   pnpm steps:backfill              # fills in the steps that have nothing yet
 *   pnpm steps:backfill -- --dry-run # prints what it would do, writes nothing
 *   pnpm steps:backfill -- --force   # redoes every step, including the ones you set by hand
 *
 * Only steps with no usages are touched, so an assignment made by hand is never overwritten.
 *
 * At the end it reports the two places where a proposal can be wrong, which is what is worth
 * reviewing: the steps it could not find any ingredient for, and the ingredients whose steps add
 * up to more than the whole.
 */
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

async function main() {
  const recipes = await db.recipe.findMany({
    select: { id: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(
    `Checking the steps of ${recipes.length} recipes${dryRun ? " (dry run)" : ""}...`,
  );

  let proposed = 0;
  const alreadyDone: string[] = [];
  const emptySteps: string[] = [];
  const overAssigned: string[] = [];

  for (const recipe of recipes) {
    const source = await readSourceContent(recipe.id);

    if (!source) {
      console.warn(`  ${recipe.slug}: no source translation found, skipped`);
      continue;
    }

    const steps = await db.step.findMany({
      where: { recipeId: recipe.id },
      orderBy: { order: "asc" },
    });

    const pending = force
      ? steps
      : steps.filter(
          (step) => parseIngredientUsages(step.ingredientUsages).length === 0,
        );

    const descriptionByOrder = new Map(
      source.content.steps.map((step) => [step.order, step.description]),
    );

    let usagesByStepOrder = new Map<number, IngredientUsage[]>();

    if (pending.length > 0) {
      try {
        const suggestions = await inferStepIngredients({
          ingredients: source.content.ingredients,
          steps: pending.map((step) => ({
            order: step.order,
            description: descriptionByOrder.get(step.order) ?? "",
          })),
        });

        usagesByStepOrder = new Map(
          suggestions.map((suggestion) => [
            suggestion.stepOrder,
            suggestion.ingredientUsages,
          ]),
        );
      } catch (error) {
        console.error(
          `  ${recipe.slug}: ${error instanceof Error ? error.message : error}`,
        );
        continue;
      }

      if (!dryRun) {
        for (const step of pending) {
          await db.step.update({
            where: { id: step.id },
            data: {
              ingredientUsages: (usagesByStepOrder.get(step.order) ??
                []) as unknown as Prisma.InputJsonValue,
            },
          });
        }
      }

      proposed += pending.length;
    } else {
      alreadyDone.push(recipe.slug);
    }

    // The report is about the recipe as it will be left, not only about the new proposal.
    const finalUsagesByStep = steps.map(
      (step) =>
        usagesByStepOrder.get(step.order) ??
        parseIngredientUsages(step.ingredientUsages),
    );

    finalUsagesByStep.forEach((usages, index) => {
      if (usages.length === 0) {
        emptySteps.push(`${recipe.slug} · step ${index + 1}`);
      }
    });

    for (const ingredient of source.content.ingredients) {
      const total = sumShares(
        finalUsagesByStep
          .flat()
          .filter((usage) => usage.order === ingredient.order),
      );

      if (total.part > total.of) {
        overAssigned.push(
          `${recipe.slug} · ${ingredient.name} (${total.part}/${total.of})`,
        );
      }
    }

    const summary = finalUsagesByStep
      .map((usages, index) => {
        if (usages.length === 0) return null;

        const names = usages
          .map((usage) => {
            const ingredient = source.content.ingredients.find(
              (candidate) => candidate.order === usage.order,
            );
            const share =
              usage.part === usage.of ? "all" : `${usage.part}/${usage.of}`;

            return `${ingredient?.name ?? "?"} (${share})`;
          })
          .join(", ");

        return `${index + 1}: ${names}`;
      })
      .filter((line) => line !== null)
      .join(" | ");

    console.log(`  ${recipe.slug}: ${summary || "nothing assigned"}`);
  }

  console.log(`\nDone. ${proposed} steps proposed.`);

  if (alreadyDone.length > 0) {
    console.log(
      `Already assigned, left alone (${alreadyDone.length}): ${alreadyDone.join(", ")}`,
    );
  }

  if (emptySteps.length > 0) {
    console.log(
      `\nSteps with no ingredient found (${emptySteps.length}), worth a look:\n  ${emptySteps.join("\n  ")}`,
    );
  }

  if (overAssigned.length > 0) {
    console.log(
      `\nIngredients whose steps add up to more than the whole (${overAssigned.length}):\n  ${overAssigned.join("\n  ")}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Step ingredient backfill failed:", error);
    process.exit(1);
  });
