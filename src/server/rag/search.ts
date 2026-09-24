import type { Where } from "chromadb";
import { getRecipeCollection } from "./client";
import { embedText } from "./embedder";
import type {
  RecipeMatch,
  RecipeSearchFilters,
  RecipeSearchOptions,
  RecipeSearchResult,
  RecipeSearchScope,
} from "./types";

export const DEFAULT_SEARCH_LIMIT = 5;
export const MAX_SEARCH_LIMIT = 20;
export const DEFAULT_MIN_SIMILARITY = 0.15;

/** Over-fetch headroom so exclusions and the similarity floor don't starve a page. */
const MAX_VECTOR_CANDIDATES = 100;

function buildWhere(
  scope: RecipeSearchScope,
  userId: string,
  filters?: RecipeSearchFilters,
): Where {
  const clauses: Where[] = [];

  if (scope === "mine") {
    // The user's own recipes, published or not.
    clauses.push({ authorId: userId });
  } else {
    // Everyone's published recipes, plus the user's own unpublished ones.
    clauses.push({ $or: [{ published: true }, { authorId: userId }] });
  }

  if (filters?.maxTotalTime !== undefined) {
    clauses.push({ totalTime: { $lte: filters.maxTotalTime } });
  }

  return clauses.length === 1 ? clauses[0]! : { $and: clauses };
}

/**
 * Semantic recipe retrieval over the vector index. Returns record ids (and their score),
 * not the recipe data: the caller hydrates them from Postgres afterwards.
 *
 * Visible recipes depend on the scope:
 * - "mine": the user's own recipes, published or not.
 * - "all": everyone's published recipes, plus the user's own unpublished ones.
 *
 * Pagination is done by exclusion (`excludeIds`) rather than offset: the caller passes the
 * ids already shown and gets the next best distinct results. That keeps "show me more"
 * stable even when the corpus changed between calls.
 */
export async function searchRecipes(
  options: RecipeSearchOptions,
): Promise<RecipeSearchResult> {
  const {
    queryText,
    scope,
    userId,
    filters,
    excludeIds = [],
    limit = DEFAULT_SEARCH_LIMIT,
    minSimilarity = DEFAULT_MIN_SIMILARITY,
  } = options;

  if (!userId) {
    throw new Error("userId is required to search recipes");
  }

  const where = buildWhere(scope, userId, filters);
  const embedding = await embedText(queryText);
  const collection = await getRecipeCollection();

  // Over-fetch by one to detect "more", plus one slot per excluded id (at most that many
  // excluded records can appear in the head of the ranking).
  const nResults = Math.min(
    limit + excludeIds.length + 1,
    MAX_VECTOR_CANDIDATES,
  );

  const result = await collection.query({
    queryEmbeddings: [embedding],
    nResults,
    where,
    include: ["distances"],
  });

  const ids = result.ids[0] ?? [];
  const distances = result.distances[0] ?? [];
  const excluded = new Set(excludeIds);

  const candidates: RecipeMatch[] = [];

  ids.forEach((id, index) => {
    if (excluded.has(id)) return;

    const distance = distances[index];
    if (distance === null || distance === undefined) return;

    const similarity = Math.max(0, Math.min(1, 1 - distance));
    if (similarity < minSimilarity) return;

    candidates.push({ id, similarity });
  });

  const selected = candidates.slice(0, limit);

  return {
    matches: selected,
    hasMore: candidates.length > selected.length,
  };
}
