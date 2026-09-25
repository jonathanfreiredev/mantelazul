import { createOpenAI } from "@ai-sdk/openai";
import { transcribe } from "ai";
import { env } from "~/env";
import { isLocale } from "~/lib/locales";

/**
 * Groq serves an OpenAI-compatible transcription endpoint, so the OpenAI provider is pointed at it
 * rather than pulling in a second provider package. The request it builds is the same one OpenAI
 * would get; only the base URL and the model id differ.
 */
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/**
 * Whisper large v3: the more accurate of Groq's two models, and still fast enough that the network
 * round trip dominates. Its turbo sibling is cheaper and quicker but reads fewer words right.
 */
const TRANSCRIPTION_MODEL_ID = "whisper-large-v3";

/** Dictation is offered only when the key it needs is configured, like Google sign-in. */
export const voiceDictationEnabled = Boolean(env.GROQ_API_KEY);

/** Turns the request's language into a hint the model accepts, or nothing at all. */
export function transcriptionLanguage(value: unknown): string | undefined {
  return isLocale(value) ? value : undefined;
}

/**
 * @param audio A complete audio file: WebM/Opus from Chrome and Firefox, MP4/AAC from Safari. The
 * SDK sniffs the format from the bytes, so no container has to be declared.
 */
export async function transcribeAudio({
  audio,
  language,
}: {
  audio: Uint8Array;
  language?: string;
}): Promise<string> {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const provider = createOpenAI({ apiKey, baseURL: GROQ_BASE_URL });

  const { text } = await transcribe({
    model: provider.transcription(TRANSCRIPTION_MODEL_ID),
    audio,
    providerOptions: { openai: { language } },
  });

  return text;
}
