import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

export const EMBEDDING_MODEL_ID = "text-embedding-3-small";

const embeddingModel = openai.embedding(EMBEDDING_MODEL_ID);

/** Embeds a single value, e.g. a user search query. */
export async function embedText(value: string): Promise<number[]> {
  const { embedding } = await embed({ model: embeddingModel, value });
  return embedding;
}

/** Embeds many documents in a single request. Order matches the input order. */
export async function embedTexts(values: string[]): Promise<number[][]> {
  if (values.length === 0) return [];

  const { embeddings } = await embedMany({ model: embeddingModel, values });
  return embeddings;
}
