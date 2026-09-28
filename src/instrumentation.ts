/**
 * OpenTelemetry wiring for Langfuse.
 *
 * Next runs this once per server instance, before any route handles a request. That timing is the
 * whole point: `registerTelemetry` is global, so a single registration here captures every model
 * call in the app — the agent turn, the embeddings behind `searchRecipes`, the translations that
 * `createRecipe` triggers and the image generation — including the ones nested inside a tool.
 * Nothing else has to be instrumented.
 *
 * Everything is imported dynamically inside the guard on purpose: this file is also compiled for
 * the edge runtime (there is middleware), and the OpenTelemetry Node SDK cannot be bundled there.
 */

type FlushableSpanProcessor = {
  forceFlush: () => Promise<void>;
};

/**
 * The processor lives on `globalThis`, not in a module variable. Next loads `instrumentation.ts`
 * and the route handlers through different module graphs, so a binding set during startup is not
 * the one a route would read. This is the same reason the Prisma client is a global.
 */
const globalForTelemetry = globalThis as unknown as {
  langfuseSpanProcessor?: FlushableSpanProcessor;
};

export async function register() {
  // Only the Node runtime can run the OpenTelemetry SDK, and every route that talks to a model
  // runs there. Returning early keeps the edge build clean.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { env } = await import("~/env");

  // Without credentials there is nothing to send anywhere, and the app is expected to run fine
  // that way (a fresh clone, a CI build). Tracing is on exactly when the keys are present.
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return;

  const { registerTelemetry } = await import("ai");
  const { LangfuseSpanProcessor } = await import("@langfuse/otel");
  const { LangfuseVercelAiSdkIntegration } =
    await import("@langfuse/vercel-ai-sdk");
  const { NodeSDK } = await import("@opentelemetry/sdk-node");

  const spanProcessor = new LangfuseSpanProcessor({
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    baseUrl: env.LANGFUSE_BASE_URL,
    // Separates local traces from the ones real users generate, without a second project.
    // Vercel sets VERCEL_ENV to "production" or "preview"; locally it is absent.
    environment: process.env.VERCEL_ENV ?? env.NODE_ENV,
  });

  const sdk = new NodeSDK({ spanProcessors: [spanProcessor] });
  sdk.start();

  globalForTelemetry.langfuseSpanProcessor = spanProcessor;

  // Registered last, once spans have somewhere to go.
  registerTelemetry(new LangfuseVercelAiSdkIntegration());
}

/**
 * Sends whatever is still pending. The processor batches spans, and a serverless function freezes
 * the moment its response ends, so a route that streams has to call this before returning or the
 * spans of the last turn never leave the machine.
 */
export async function flushTelemetry(): Promise<void> {
  await globalForTelemetry.langfuseSpanProcessor?.forceFlush();
}
