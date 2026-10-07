"use client";
import { PaperclipIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FileRejection } from "react-dropzone";
import { toast } from "sonner";
import {
  ImageUpload,
  type ImageWithPreview,
} from "../image-uploader/image-upload";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface AttachImageInputProps {
  images: ImageWithPreview[];
  onImagesChange: (images: ImageWithPreview[]) => void;
  /** How many images the message can carry in total. */
  maxImages: number;
  disabled?: boolean;
}

// Allows attaching images to the ai assistant chat message.
export function AttachImageInput({
  images,
  onImagesChange,
  maxImages,
  disabled,
}: AttachImageInputProps) {
  const t = useTranslations("Chat");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const remaining = Math.max(0, maxImages - images.length);

  const handleRejected = (rejections: FileRejection[]) => {
    const codes = rejections.flatMap((rejection) =>
      rejection.errors.map((error) => error.code),
    );

    if (codes.includes("too-many-files")) {
      toast.error(t("attachLimit", { count: maxImages }));
    } else if (codes.includes("file-too-large")) {
      toast.error(t("imageTooLarge"));
    } else if (codes.includes("file-invalid-type")) {
      toast.error(t("imageInvalidType"));
    } else {
      toast.error(t("imageUploadFailed"));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="rounded-full"
        aria-label={t("attachTitle")}
        title={t("attachTitle")}
        onClick={() => {
          if (remaining === 0) {
            // The button stays enabled so tapping it explains the limit instead of
            // doing nothing, which reads as a broken control.
            toast.error(t("attachLimit", { count: maxImages }));
            return;
          }

          setImageDialogOpen(true);
        }}
      >
        <PaperclipIcon />
      </Button>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("attachTitle")}</DialogTitle>
            <DialogDescription>{t("attachDescription")}</DialogDescription>
          </DialogHeader>

          <ImageUpload
            id="image"
            maxImages={remaining}
            onRejected={handleRejected}
            handleImages={(newImages) => {
              if (newImages.length === 0) return;

              onImagesChange([...images, ...newImages].slice(0, maxImages));
              setImageDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
