import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "~/server/better-auth/server";
import {
  transcribeAudio,
  transcriptionLanguage,
  voiceDictationEnabled,
} from "~/server/transcription";

/** A couple of minutes of Opus is a few hundred kilobytes, so this is generous. */
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!voiceDictationEnabled) {
    return NextResponse.json({ error: "dictation_disabled" }, { status: 503 });
  }

  const form = await req.formData();
  const audio = form.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "missing_audio" }, { status: 400 });
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "audio_too_large" }, { status: 413 });
  }

  try {
    const text = await transcribeAudio({
      audio: new Uint8Array(await audio.arrayBuffer()),
      language: transcriptionLanguage(form.get("language")),
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Transcription failed", error);

    return NextResponse.json(
      { error: "transcription_failed" },
      { status: statusCodeOf(error) === 429 ? 429 : 502 },
    );
  }
}

/** The AI SDK attaches the upstream status to its errors; 429 is worth telling the client about. */
function statusCodeOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return undefined;
  }

  const value = (error as { statusCode?: unknown }).statusCode;
  return typeof value === "number" ? value : undefined;
}
