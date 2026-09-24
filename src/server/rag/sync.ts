import type { Prisma } from "generated/prisma/client";
import { db } from "~/server/db";
import { getRecipeCollection } from "./client";
import { buildRecipeDocument, buildRecipeMetadata } from "./document";
import { embedText, embedTexts } from "./embedder";
import type { RecipeIndexSource, RecipeMetadata } from "./types";

const recipeIndexInclude = {
  ingredients: { orderBy: { order: "asc" } },
  steps: { orderBy: { order: "asc" } },
  tags: { include: { tag: true } },
} satisfies Prisma.RecipeInclude;

type RecipeWithRelations = Prisma.RecipeGetPayload<{
  include: typeof recipeIndexInclude;
}>;

/**
 * Maps a Prisma recipe (with relations) to the pure source used by the document builder.
 */
export function toRecipeIndexSource(
  recipe: RecipeWithRelations,
): RecipeIndexSource {
  return {
    id: recipe.id,
    authorId: recipe.authorId,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    category: recipe.category,
    difficulty: recipe.difficulty,
    published: recipe.published,
    defaultServings: recipe.defaultServings,
    preparationTime: recipe.preparationTime,
    cookingTime: recipe.cookingTime,
    restingTime: recipe.restingTime,
    calories: recipe.calories,
    carbohydrates: recipe.carbohydrates,
    protein: recipe.protein,
    fat: recipe.fat,
    createdAt: recipe.createdAt,
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: ingredient.quantity.toString(),
      unit: ingredient.unit,
    })),
    steps: recipe.steps.map((step) => ({
      description: step.description,
    })),
    tags: recipe.tags.map((recipeTag) => recipeTag.tag.name),
  };
}

async function loadRecipeIndexSources(
  ids: string[],
): Promise<RecipeIndexSource[]> {
  if (ids.length === 0) return [];

  const recipes = await db.recipe.findMany({
    where: { id: { in: ids } },
    include: recipeIndexInclude,
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
    RecipeMetadata | null | undefined;

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
  const recipes = await db.recipe.findMany({ include: recipeIndexInclude });
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
