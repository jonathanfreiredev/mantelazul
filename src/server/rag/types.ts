/**
 * Types for the recipe retrieval-augmented generation (RAG) layer backed by Chroma.
 */

export interface RecipeIndexIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface RecipeIndexStep {
  description: string;
}

/**
 * The recipe shape required to build the embedding document and its metadata.
 * Kept independent from Prisma so the document builder stays pure and testable.
 */
export interface RecipeIndexSource {
  id: string;
  authorId: string | null;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: string;
  difficulty: string;
  published: boolean;
  defaultServings: number;
  preparationTime: number;
  cookingTime: number;
  restingTime: number;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  createdAt: Date;
  ingredients: RecipeIndexIngredient[];
  steps: RecipeIndexStep[];
  tags: string[];
}

/**
 * Metadata stored alongside every recipe record in Chroma.
 *
 * It only holds what is NOT in the embedded document and what the vector search needs to
 * filter on, plus the sync hash. Everything user-visible is hydrated from Postgres by id
 * after the search, so it always stays fresh.
 */
export type RecipeMetadata = {
  /**
   * Owner of the recipe. Empty string when the author was deleted (Recipe.authorId is
   * nullable). Always present so the value is always overwritten on sync (Chroma merges
   * metadata on upsert, so omitting a key would leave a stale value behind).
   */
  authorId: string;
  /** Whether the recipe is visible to everyone. Keeps unpublished recipes out of global search. */
  published: boolean;
  /** preparation + cooking + resting time, in minutes. Used for the "maxTotalTime" filter. */
  totalTime: number;
  /** SHA-256 of the embedded document. Lets us skip re-embedding unchanged recipes. */
  contentHash: string;
};

export interface RecipeSearchFilters {
  /** Maximum total time (minutes). Applied through Chroma metadata. */
  maxTotalTime?: number;
}

export type RecipeSearchScope = "all" | "mine";

/**
 * Scope meaning:
 * - "all": everyone's published recipes plus the user's own unpublished ones.
 * - "mine": the user's own recipes only, published or not.
 */
export interface RecipeSearchOptions {
  queryText: string;
  scope: RecipeSearchScope;
  /** Authenticated user id. Required when scope is "mine". */
  userId: string;
  filters?: RecipeSearchFilters;
  /** Recipe ids already shown to the user, excluded to power "show me more". */
  excludeIds?: string[];
  limit?: number;
  /** Cosine similarity floor. Hits below it are discarded. */
  minSimilarity?: number;
}

/** A retrieval result before hydration: the record id and its cosine similarity score. */
export interface RecipeMatch {
  id: string;
  similarity: number;
}

export interface RecipeSearchResult {
  matches: RecipeMatch[];
  hasMore: boolean;
}

/** A fully hydrated recipe, ready to be shown to the user. */
export interface RecipeSearchHit {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string[];
  likesCount: number;
  totalTime: number;
  imageUrl: string | null;
  /** Cosine similarity (0..1). Only present for semantic search results. */
  similarity?: number;
}
