import "dotenv/config";
import { db } from "~/server/db";
import { generateRecipeTranslations } from "~/server/translations/generate";
import { readSourceContent } from "~/server/translations/source";
import { replaceRecipeTranslations } from "~/server/translations/store";

/**
 * Generates every missing translation of every recipe from its source locale.
 *
 * Run once after the translation migration, and any time the translations need to be rebuilt:
 *   pnpm translations:backfill
 */
async function main() {
  const recipes = await db.recipe.findMany({
    select: { id: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Backfilling translations for ${recipes.length} recipes...`);

  let done = 0;

  for (const recipe of recipes) {
    const source = await readSourceContent(recipe.id);

    if (!source) {
      console.warn(`  skipping ${recipe.slug}: no source translation found`);
      continue;
    }

    const translations = await generateRecipeTranslations({
      sourceLocale: source.sourceLocale,
      content: source.content,
    });

    await replaceRecipeTranslations(recipe.id, translations);

    done += 1;
    console.log(
      `  ${recipe.slug} [${source.sourceLocale}] -> ${Object.keys(
        translations,
      ).join(", ")}`,
    );
  }

  console.log(`Done. ${done} recipes translated.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Translation backfill failed:", error);
    process.exit(1);
  });
