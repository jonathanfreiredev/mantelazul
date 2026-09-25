"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DictationError,
  VoiceRecorder,
  type DictationErrorCode,
} from "~/lib/voice/recorder";

/** The server rejects anything larger, so it is checked here before spending the upload. */
const MAX_CLIP_BYTES = 4 * 1024 * 1024;

/** How often the elapsed time on screen is refreshed. */
const ELAPSED_TICK_MS = 200;

export type DictationFailure =
  | DictationErrorCode
  | "nothing-recorded"
  | "nothing-heard"
  | "too-long"
  | "transcription-failed";

export type DictationStatus = "idle" | "recording" | "transcribing" | "failed";

export interface UseVoiceDictationOptions {
  /** Language hint for the model, from the active locale. */
  language: string;
  onAccept: (text: string) => void;
  onFailure: (failure: DictationFailure) => void;
}

export interface UseVoiceDictationResult {
  status: DictationStatus;
  elapsedMs: number;
  /** Live microphone levels, oldest first. Read by the waveform, never through React state. */
  levels: { current: number[] };
  start: () => void;
  cancel: () => void;
  /** Transcribes the recording and hands the text over; retries after a failure. */
  accept: () => void;
}

export function useVoiceDictation({
  language,
  onAccept,
  onFailure,
}: UseVoiceDictationOptions): UseVoiceDictationResult {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const levelsRef = useRef<number[]>([]);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  /** Kept after a failed transcription so the accept button can try again without re-recording. */
  const clipRef = useRef<Blob | null>(null);
  const busyRef = useRef(false);
  const elapsedTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  /** Bumped on every reset, so late answers from a previous dictation are ignored. */
  const sessionRef = useRef(0);

  // The latest props, so the callbacks below can stay stable for the lifetime of a recording.
  const languageRef = useRef(language);
  const onAcceptRef = useRef(onAccept);
  const onFailureRef = useRef(onFailure);
  useEffect(() => {
    languageRef.current = language;
    onAcceptRef.current = onAccept;
    onFailureRef.current = onFailure;
  });

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current === null) return;
    window.clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    sessionRef.current += 1;
    stopElapsedTimer();
    recorderRef.current = null;
    clipRef.current = null;
    setElapsedMs(0);
    setStatus("idle");
  }, [stopElapsedTimer]);

  const accept = useCallback(async () => {
    // A second error, or a second click, must not start a second transcription.
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const session = sessionRef.current;
      let clip = clipRef.current;

      if (!clip) {
        setStatus("transcribing");

        const recorder = recorderRef.current;
        recorderRef.current = null;
        clip = (await recorder?.stop()) ?? null;

        if (sessionRef.current !== session) return;

        if (!clip) {
          reset();
          onFailureRef.current("nothing-recorded");
          return;
        }

        if (clip.size > MAX_CLIP_BYTES) {
          reset();
          onFailureRef.current("too-long");
          return;
        }

        clipRef.current = clip;
      } else {
        setStatus("transcribing");
      }

      try {
        const text = await requestTranscription({
          audio: clip,
          language: languageRef.current,
        });

        if (sessionRef.current !== session) return;

        stopElapsedTimer();
        clipRef.current = null;
        setStatus("idle");

        if (text.length === 0) {
          onFailureRef.current("nothing-heard");
          return;
        }

        onAcceptRef.current(text);
      } catch {
        if (sessionRef.current !== session) return;

        // The clip stays, so accepting again is a retry rather than a new recording.
        setStatus("failed");
        onFailureRef.current("transcription-failed");
      }
    } finally {
      busyRef.current = false;
    }
  }, [reset, stopElapsedTimer]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    reset();
    void recorder?.stop();
  }, [reset]);

  const start = useCallback(() => {
    reset();

    const recorder = new VoiceRecorder(
      {
        onError: (error) => {
          // The microphone went away mid-recording. Keep what was captured by transcribing it,
          // and say why it stopped.
          onFailureRef.current(error.code);
          void accept();
        },
        onLimitReached: () => void accept(),
      },
      levelsRef,
    );

    recorderRef.current = recorder;
    setStatus("recording");
    startedAtRef.current = Date.now();
    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, ELAPSED_TICK_MS);

    void recorder.start().catch((error) => {
      if (recorderRef.current !== recorder) return;

      reset();
      onFailureRef.current(
        error instanceof DictationError ? error.code : "no-microphone",
      );
    });
  }, [accept, reset]);

  return {
    status,
    elapsedMs,
    levels: levelsRef,
    start,
    cancel,
    accept: () => void accept(),
  };
}

async function requestTranscription({
  audio,
  language,
}: {
  audio: Blob;
  language: string;
}): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, "dictation");
  form.append("language", language);

  const response = await fetch("/api/transcribe", { method: "POST", body: form });

  if (!response.ok) {
    throw new Error(`Transcription failed with ${response.status}`);
  }

  const payload = (await response.json()) as { text?: unknown };
  const text = typeof payload.text === "string" ? payload.text : "";

  return text.replace(/\s+/g, " ").trim();
}
