import "dotenv/config";
import { RECIPE_COLLECTION_NAME, chromaClient } from "~/server/rag/client";
import { reindexAllRecipes } from "~/server/rag/sync";

/**
 * Backfills the Chroma recipe index with every recipe in Postgres.
 *
 * Usage:
 *   pnpm rag:index            # upsert every recipe (idempotent)
 *   pnpm rag:index -- --reset # drop the collection first, then rebuild it
 */
async function main() {
  const reset = process.argv.includes("--reset");

  if (reset) {
    console.log(`Dropping Chroma collection "${RECIPE_COLLECTION_NAME}"...`);
    await chromaClient
      .deleteCollection({ name: RECIPE_COLLECTION_NAME })
      .catch(() => {
        console.log("Collection did not exist yet; nothing to drop.");
      });
  }

  console.log("Indexing recipes...");
  const count = await reindexAllRecipes();
  console.log(
    `Done. Indexed ${count} recipes into "${RECIPE_COLLECTION_NAME}".`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Recipe indexing failed:", error);
    process.exit(1);
  });
