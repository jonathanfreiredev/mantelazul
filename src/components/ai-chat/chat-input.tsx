"use client";

import {
  ArrowUpIcon,
  CheckIcon,
  LoaderIcon,
  MicIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useVoiceDictation,
  type DictationFailure,
} from "~/hooks/use-voice-dictation";
import { MAX_DICTATION_MS } from "~/lib/voice/recorder";
import { AttachImageInput } from "./attach-image-input";
import type { ImageWithPreview } from "../image-uploader/image-upload";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { VoiceWaveform } from "./voice-waveform";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isBusy: boolean;
  disabled: boolean;
  attachedImage: ImageWithPreview | null;
  onAttachedImageChange: (image: ImageWithPreview | null) => void;
  showAttachButton: boolean;
  /** Hidden when no transcription provider is configured. */
  voiceEnabled: boolean;
}

/**
 * The chat composer. Used in both the collapsed prompt and the open drawer; `showAttachButton`
 * hides the image picker in the collapsed variant.
 *
 * Dictation replaces the button row with the recording itself: the field above stays visible but
 * disabled, and accepting puts the text at the end of whatever was already typed, so the user
 * decides when to send.
 */
export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isBusy,
  disabled,
  attachedImage,
  onAttachedImageChange,
  showAttachButton,
  voiceEnabled,
}: ChatInputProps) {
  const t = useTranslations("Chat");
  const tVoice = useTranslations("VoiceDictation");
  const locale = useLocale();

  const dictation = useVoiceDictation({
    language: locale,
    onAccept: (text) => {
      const typed = value.trim();
      onChange(typed.length > 0 ? `${typed} ${text}` : text);
    },
    onFailure: (failure) => {
      toast.error(tVoice(failureMessageKey(failure)), {
        position: "bottom-right",
      });
    },
  });

  const isDictating = dictation.status !== "idle";
  const isTranscribing = dictation.status === "transcribing";
  const isRetry = dictation.status === "failed";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white/80 px-4 py-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Textarea
          className="w-full resize-none border-none py-2 focus-visible:ring-0"
          value={value}
          rows={1}
          placeholder={t("placeholder")}
          disabled={disabled || isDictating}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            // Enter submits, like in any chat app. Shift/Cmd/Ctrl+Enter inserts a newline.
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.metaKey &&
              !event.ctrlKey
            ) {
              event.preventDefault();
              if (!disabled && !isBusy && value.trim() !== "") onSubmit();
            }
          }}
        />

        {isDictating ? (
          <div className="mt-1 flex items-center gap-2">
            <span className="sr-only" aria-live="polite">
              {isTranscribing ? tVoice("transcribing") : tVoice("recording")}
            </span>

            <VoiceWaveform
              levels={dictation.levels}
              className="h-8 min-w-0 flex-1 text-zinc-500 dark:text-zinc-400"
            />

            <span
              aria-hidden
              className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
            >
              {formatTime(dictation.elapsedMs)} / {formatTime(MAX_DICTATION_MS)}
            </span>
            <span className="sr-only">
              {tVoice("timeLabel", {
                elapsed: formatTime(dictation.elapsedMs),
                total: formatTime(MAX_DICTATION_MS),
              })}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={tVoice("cancel")}
              title={tVoice("cancel")}
              onClick={dictation.cancel}
            >
              <XIcon />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={isRetry ? tVoice("retry") : tVoice("accept")}
              title={isRetry ? tVoice("retry") : tVoice("accept")}
              disabled={isTranscribing}
              onClick={dictation.accept}
            >
              {isTranscribing ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <CheckIcon />
              )}
            </Button>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {showAttachButton && (
                <AttachImageInput
                  value={attachedImage}
                  onChange={onAttachedImageChange}
                  disabled={disabled}
                />
              )}

              {voiceEnabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label={tVoice("open")}
                  title={tVoice("open")}
                  disabled={disabled || isBusy}
                  onClick={dictation.start}
                >
                  <MicIcon />
                </Button>
              )}
            </div>

            {isBusy ? (
              <Button
                type="button"
                variant="default"
                size="icon"
                className="rounded-full"
                onClick={onStop}
              >
                <SquareIcon fill="white" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="default"
                size="icon"
                className="rounded-full"
                disabled={disabled || value.trim() === ""}
              >
                <ArrowUpIcon />
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

function failureMessageKey(failure: DictationFailure): string {
  switch (failure) {
    case "permission-denied":
      return "permissionDenied";
    case "no-microphone":
      return "noMicrophone";
    case "microphone-lost":
      return "microphoneLost";
    case "unsupported":
      return "unsupported";
    case "nothing-recorded":
      return "nothingRecorded";
    case "nothing-heard":
      return "nothingHeard";
    case "too-long":
      return "tooLong";
    default:
      return "transcriptionFailed";
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
