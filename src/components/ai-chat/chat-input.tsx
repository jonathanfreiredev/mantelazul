"use client";

import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { AttachImageInput } from "./attach-image-input";
import type { ImageWithPreview } from "../image-uploader/image-upload";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

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
}

/**
 * The chat composer. Used in both the collapsed prompt and the open drawer; `showAttachButton`
 * hides the image picker in the collapsed variant.
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
}: ChatInputProps) {
  const t = useTranslations("Chat");

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-300 bg-white/40 px-4 py-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
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
          disabled={disabled}
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
        <div className="mt-1 flex items-center justify-between">
          {showAttachButton ? (
            <AttachImageInput
              value={attachedImage}
              onChange={onAttachedImageChange}
              disabled={disabled}
            />
          ) : (
            <span />
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
      </form>
    </div>
  );
}
