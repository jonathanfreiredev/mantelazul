"use client";

import {
  ArrowUpIcon,
  CheckIcon,
  LoaderIcon,
  MicIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useVoiceDictation,
  type DictationFailure,
} from "~/hooks/use-voice-dictation";
import { MAX_DICTATION_MS } from "~/lib/voice/recorder";
import { AttachImageInput } from "./attach-image-input";
import type { ImageWithPreview } from "../image-uploader/image-upload";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentMedia,
} from "../ui/attachment";
import { Button } from "../ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "../ui/input-group";
import { VoiceWaveform } from "./voice-waveform";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isBusy: boolean;
  disabled: boolean;
  attachedImages: ImageWithPreview[];
  onAttachedImagesChange: (images: ImageWithPreview[]) => void;
  /** How many images the message can carry in total. */
  maxAttachedImages: number;
  showAttachButton: boolean;
  /** Hidden when no transcription provider is configured. */
  voiceEnabled: boolean;
}

/**
 * The chat composer. Used in both the collapsed prompt and the open panel; `showAttachButton`
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
  attachedImages,
  onAttachedImagesChange,
  maxAttachedImages,
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
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <InputGroup className="h-auto rounded-2xl border-zinc-300 bg-white/90 px-1 shadow-xl backdrop-blur md:h-auto dark:border-zinc-800 dark:bg-zinc-900/90">
        {attachedImages.length > 0 && (
          <InputGroupAddon align="block-start" className="flex-wrap gap-2">
            {attachedImages.map((image, index) => (
              <Attachment
                key={image.preview}
                size="sm"
                className="bg-background/80 min-w-0"
              >
                <AttachmentMedia variant="image">
                  <Image
                    src={image.preview}
                    alt={t("attachedImageAlt")}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </AttachmentMedia>
                <AttachmentActions>
                  <AttachmentAction
                    aria-label={t("removeAttachedImage")}
                    title={t("removeAttachedImage")}
                    onClick={() =>
                      onAttachedImagesChange(
                        attachedImages.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <XIcon />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </InputGroupAddon>
        )}

        <InputGroupTextarea
          className="max-h-40 min-h-11 px-3 py-3 text-base md:max-h-32 md:min-h-9 md:py-2.5 md:text-sm"
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
          <InputGroupAddon align="block-end" className="gap-2 py-2">
            <span className="sr-only" aria-live="polite">
              {isTranscribing ? tVoice("transcribing") : tVoice("recording")}
            </span>

            <VoiceWaveform
              levels={dictation.levels}
              className="h-10 min-w-0 flex-1 text-zinc-500 md:h-8 dark:text-zinc-400"
            />

            <span
              aria-hidden
              className="text-muted-foreground shrink-0 text-xs tabular-nums md:text-[11px]"
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
          </InputGroupAddon>
        ) : (
          <InputGroupAddon align="block-end" className="gap-1 py-1.5">
            {showAttachButton && (
              <AttachImageInput
                images={attachedImages}
                onImagesChange={onAttachedImagesChange}
                maxImages={maxAttachedImages}
                disabled={disabled}
              />
            )}

            <div className="ml-auto flex items-center gap-1">
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
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
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
