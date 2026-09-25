/**
 * Records the microphone as a single clip.
 *
 * Nothing has to appear on screen while speaking, so there is no reason to cut the audio up: the
 * whole dictation goes to the model in one request when the user accepts it. That keeps a dictation
 * at one request instead of one per pause, which matters because the free plans limit how many
 * requests you may send per minute, not how many minutes of audio.
 */

/** Dictation stops on its own here, so a forgotten microphone cannot run all afternoon. */
export const MAX_DICTATION_MS = 120_000;

/** How often the microphone level is sampled. Also the resolution of the waveform. */
export const LEVEL_FRAME_MS = 50;

/** The level history never needs to grow past the cap, plus a second of slack. */
export const MAX_LEVEL_SAMPLES =
  Math.ceil(MAX_DICTATION_MS / LEVEL_FRAME_MS) + 20;

/** A recorder that errored out may never fire its stop event; do not wait forever. */
const RECORDING_STOP_TIMEOUT_MS = 2_000;

/** Chrome and Firefox record Opus in WebM; Safari records AAC in MP4. Both are accepted upstream. */
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

export type DictationErrorCode =
  | "unsupported"
  | "permission-denied"
  | "no-microphone"
  | "microphone-lost";

export class DictationError extends Error {
  constructor(readonly code: DictationErrorCode) {
    super(code);
    this.name = "DictationError";
  }
}

export function isDictationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

export interface VoiceRecorderCallbacks {
  onError: (error: DictationError) => void;
  /** The two minute cap was reached; the caller decides what to do about it. */
  onLimitReached: () => void;
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;

  private audioContext: AudioContext | null = null;

  private analyser: AnalyserNode | null = null;

  private frame: Float32Array<ArrayBuffer> | null = null;

  private timer: number | null = null;

  private recorder: MediaRecorder | null = null;

  private chunks: Blob[] = [];

  private mimeType = "";

  private startedAtMs = 0;

  private stopped = false;

  private limitNotified = false;

  private clip: Blob | null = null;

  /**
   * Dictating means looking at the screen. If the page goes away — another tab, another app, a
   * locked phone — browsers freeze the timers that meter the recording, so it would keep capturing
   * into the void. Stopping is the honest thing to do; the caller transcribes what there is.
   */
  private readonly handleVisibilityChange = () => {
    if (this.stopped) return;
    if (document.hidden) {
      this.callbacks.onError(new DictationError("microphone-lost"));
    }
  };

  constructor(
    private readonly callbacks: VoiceRecorderCallbacks,
    /** One level per frame, oldest first; the waveform reads it so nothing re-renders React. */
    private readonly levels: { current: number[] },
  ) {}

  async start(): Promise<void> {
    if (!isDictationSupported()) throw new DictationError("unsupported");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      throw new DictationError(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "permission-denied"
          : "no-microphone",
      );
    }

    // Stopped while the browser was asking for permission: hand the microphone straight back.
    if (this.stopped) {
      this.stopTracks(stream);
      return;
    }

    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      this.stopTracks(stream);
      throw new DictationError("unsupported");
    }

    this.stream = stream;
    this.mimeType = pickMimeType();
    this.levels.current = [];
    this.chunks = [];
    this.watchTracks(stream);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    this.audioContext = new AudioContextClass();
    await this.audioContext.resume();

    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.2;
    source.connect(this.analyser);
    this.frame = new Float32Array(this.analyser.fftSize);

    const recorder = new MediaRecorder(
      stream,
      this.mimeType ? { mimeType: this.mimeType } : undefined,
    );

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    });

    recorder.addEventListener("error", () => {
      this.callbacks.onError(new DictationError("microphone-lost"));
    });

    recorder.start();
    this.recorder = recorder;

    this.startedAtMs = performance.now();
    this.timer = window.setInterval(() => this.tick(), LEVEL_FRAME_MS);

    // The page may already be hidden by the time the microphone is granted.
    this.handleVisibilityChange();
  }

  /** Stops the microphone and returns the clip, or null when nothing was captured. */
  async stop(): Promise<Blob | null> {
    if (this.stopped) return this.clip;

    this.stopped = true;
    this.clearTimer();
    this.clip = await this.finishRecording();
    this.release();

    return this.clip;
  }

  private tick(): void {
    if (this.stopped) return;

    if (this.levels.current.length < MAX_LEVEL_SAMPLES) {
      this.levels.current.push(this.readLevel());
    }

    const atMs = performance.now() - this.startedAtMs;

    if (atMs >= MAX_DICTATION_MS && !this.limitNotified) {
      this.limitNotified = true;
      this.callbacks.onLimitReached();
    }
  }

  private finishRecording(): Promise<Blob | null> {
    const recorder = this.recorder;
    this.recorder = null;

    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve(this.buildClip());
    }

    return new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(this.buildClip());
      };

      window.setTimeout(finish, RECORDING_STOP_TIMEOUT_MS);
      recorder.addEventListener("stop", finish, { once: true });
      recorder.stop();
    });
  }

  private buildClip(): Blob | null {
    const chunks = this.chunks;
    this.chunks = [];

    if (chunks.length === 0) return null;

    const clip = new Blob(chunks, { type: this.mimeType || "audio/webm" });
    return clip.size > 0 ? clip : null;
  }

  private readLevel(): number {
    const analyser = this.analyser;
    const frame = this.frame;
    if (!analyser || !frame) return 0;

    analyser.getFloatTimeDomainData(frame);

    let sum = 0;
    for (const sample of frame) {
      sum += sample * sample;
    }

    return Math.sqrt(sum / frame.length);
  }

  /** The system can take the microphone away: a call, another app, the app going to background. */
  private watchTracks(stream: MediaStream): void {
    for (const track of stream.getAudioTracks()) {
      track.addEventListener("ended", () => {
        if (this.stopped) return;
        this.callbacks.onError(new DictationError("microphone-lost"));
      });
    }
  }

  private clearTimer(): void {
    if (this.timer === null) return;
    window.clearInterval(this.timer);
    this.timer = null;
  }

  private release(): void {
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    if (this.stream) this.stopTracks(this.stream);
    this.stream = null;

    if (this.audioContext) {
      void this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }

    this.analyser = null;
    this.frame = null;
  }

  private stopTracks(stream: MediaStream): void {
    for (const track of stream.getTracks()) track.stop();
  }
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  for (const candidate of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }

  return "";
}
