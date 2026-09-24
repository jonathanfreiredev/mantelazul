import { DEFAULT_LOCALE } from "~/lib/locales";
import { db } from "~/server/db";
import {
  recipeWithTranslationsInclude,
  toRecipeDto,
  type RecipeWithTranslations,
} from "~/server/translations/resolve";
import { getRecipeCollection } from "./client";
import { buildRecipeDocument, buildRecipeMetadata } from "./document";
import { embedText, embedTexts } from "./embedder";
import type { RecipeIndexSource, RecipeMetadata } from "./types";

/**
 * Maps a Prisma recipe (with relations) to the pure source used by the document builder.
 *
 * The document is always built from the canonical locale, regardless of who is searching: the
 * multilingual embedding model is what lets a query in any language match it.
 */
export function toRecipeIndexSource(
  recipe: RecipeWithTranslations,
): RecipeIndexSource {
  const dto = toRecipeDto(recipe, DEFAULT_LOCALE);

  return {
    id: dto.id,
    authorId: dto.authorId,
    slug: dto.slug,
    title: dto.title,
    description: dto.description,
    imageUrl: dto.imageUrl,
    category: dto.category,
    difficulty: dto.difficulty,
    published: dto.published,
    defaultServings: dto.defaultServings,
    preparationTime: dto.preparationTime,
    cookingTime: dto.cookingTime,
    restingTime: dto.restingTime,
    calories: dto.calories,
    carbohydrates: dto.carbohydrates,
    protein: dto.protein,
    fat: dto.fat,
    createdAt: dto.createdAt,
    ingredients: dto.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    })),
    steps: dto.steps.map((step) => ({
      description: step.description,
    })),
    tags: dto.tags.map((recipeTag) => recipeTag.tag.name),
  };
}

async function loadRecipeIndexSources(
  ids: string[],
): Promise<RecipeIndexSource[]> {
  if (ids.length === 0) return [];

  const recipes = await db.recipe.findMany({
    where: { id: { in: ids } },
    include: recipeWithTranslationsInclude,
  });

  return recipes.map(toRecipeIndexSource);
}

/**
 * Embeds and upserts a single recipe. Throws on failure; use `syncRecipeIndex`
 * from write paths so a vector DB outage never breaks saving a recipe.
 */
export async function indexRecipe(id: string): Promise<void> {
  const [source] = await loadRecipeIndexSources([id]);

  if (!source) {
    await getRecipeCollection().then((collection) =>
      collection.delete({ ids: [id] }),
    );
    return;
  }

  const document = buildRecipeDocument(source);
  const metadata = buildRecipeMetadata(source, document);
  const collection = await getRecipeCollection();

  const existing = await collection.get({
    ids: [id],
    include: ["metadatas"],
  });
  const existingMetadata = existing.metadatas[0] as
    | RecipeMetadata
    | null
    | undefined;

  // Content unchanged: refresh metadata only (e.g. publish state) without re-embedding.
  if (existingMetadata?.contentHash === metadata.contentHash) {
    await collection.update({ ids: [id], metadatas: [metadata] });
    return;
  }

  const embedding = await embedText(document);

  await collection.upsert({
    ids: [id],
    embeddings: [embedding],
    documents: [document],
    metadatas: [metadata],
  });
}

/**
 * Mutation-safe sync: logs and swallows errors so callers never fail because of Chroma.
 */
export async function syncRecipeIndex(id: string): Promise<void> {
  try {
    await indexRecipe(id);
  } catch (error) {
    console.error(
      `[rag] Failed to sync recipe ${id} to the vector index`,
      error,
    );
  }
}

/** Mutation-safe removal of a recipe from the vector index. */
export async function removeRecipeIndex(id: string): Promise<void> {
  try {
    const collection = await getRecipeCollection();
    await collection.delete({ ids: [id] });
  } catch (error) {
    console.error(
      `[rag] Failed to remove recipe ${id} from the vector index`,
      error,
    );
  }
}

/**
 * Re-embeds every recipe. Used by the backfill script and when the embedding model
 * changes. Throws on failure so the caller can report it.
 */
export async function reindexAllRecipes(batchSize = 50): Promise<number> {
  const recipes = await db.recipe.findMany({
    include: recipeWithTranslationsInclude,
  });
  const collection = await getRecipeCollection();

  let indexed = 0;

  for (let offset = 0; offset < recipes.length; offset += batchSize) {
    const batch = recipes.slice(offset, offset + batchSize).map((recipe) => {
      const source = toRecipeIndexSource(recipe);
      const document = buildRecipeDocument(source);
      return {
        id: source.id,
        document,
        metadata: buildRecipeMetadata(source, document),
      };
    });

    const embeddings = await embedTexts(batch.map((item) => item.document));

    await collection.upsert({
      ids: batch.map((item) => item.id),
      embeddings,
      documents: batch.map((item) => item.document),
      metadatas: batch.map((item) => item.metadata),
    });

    indexed += batch.length;
  }

  return indexed;
}
