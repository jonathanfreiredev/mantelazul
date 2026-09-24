import { ChromaClient, CloudClient, type Collection } from "chromadb";
import { env } from "~/env";

export const RECIPE_COLLECTION_NAME = "recipes";

/**
 * Builds the Chroma client for the current environment.
 *
 * With `CHROMA_API_KEY` set we connect to Chroma Cloud (API key + tenant + database over HTTPS);
 * otherwise we talk to the server at `CHROMA_URL`, which is how local development runs against
 * `pnpm chroma:dev`. Keying off the API key instead of `NODE_ENV` keeps a self-hosted production
 * server working too.
 */
function createChromaClient(): ChromaClient {
  const apiKey = env.CHROMA_API_KEY;

  if (apiKey) {
    return new CloudClient({
      apiKey,
      tenant: env.CHROMA_TENANT,
      database: env.CHROMA_DATABASE,
      // Chroma Cloud defaults to "api.trychroma.com"; set CHROMA_HOST for another region.
      ...(env.CHROMA_HOST ? { host: env.CHROMA_HOST } : {}),
    });
  }

  const chromaUrl = new URL(env.CHROMA_URL);
  const isSecure = chromaUrl.protocol === "https:";

  return new ChromaClient({
    host: chromaUrl.hostname,
    port: Number(chromaUrl.port || (isSecure ? "443" : "80")),
    ssl: isSecure,
  });
}

export const chromaClient = createChromaClient();

let collectionPromise: Promise<Collection> | null = null;

/**
 * Returns the shared `recipes` collection, creating it on first use.
 *
 * `embeddingFunction: null` disables Chroma's default embedding function (which would
 * download an ONNX model). We always provide embeddings computed with the AI SDK.
 *
 * Cosine distance is set through a different index depending on where Chroma runs: SPANN on
 * Chroma Cloud, HNSW on a single-node server.
 */
export function getRecipeCollection(): Promise<Collection> {
  collectionPromise ??= chromaClient.getOrCreateCollection({
    name: RECIPE_COLLECTION_NAME,
    configuration: env.CHROMA_API_KEY
      ? { spann: { space: "cosine" } }
      : { hnsw: { space: "cosine" } },
    embeddingFunction: null,
  });

  return collectionPromise;
}
