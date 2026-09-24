import { ChromaClient, type Collection } from "chromadb";
import { env } from "~/env";

export const RECIPE_COLLECTION_NAME = "recipes";

const chromaUrl = new URL(env.CHROMA_URL);
const isSecure = chromaUrl.protocol === "https:";

export const chromaClient = new ChromaClient({
  host: chromaUrl.hostname,
  port: Number(chromaUrl.port || (isSecure ? "443" : "80")),
  ssl: isSecure,
});

let collectionPromise: Promise<Collection> | null = null;

/**
 * Returns the shared `recipes` collection, creating it on first use.
 *
 * `embeddingFunction: null` disables Chroma's default embedding function (which would
 * download an ONNX model). We always provide embeddings computed with the AI SDK.
 */
export function getRecipeCollection(): Promise<Collection> {
  collectionPromise ??= chromaClient.getOrCreateCollection({
    name: RECIPE_COLLECTION_NAME,
    configuration: { hnsw: { space: "cosine" } },
    embeddingFunction: null,
  });

  return collectionPromise;
}
