"use client";
import { PaperclipIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
  DialogTrigger,
} from "../ui/dialog";

interface AttachImageInputProps {
  value: ImageWithPreview | null;
  onChange: (image: ImageWithPreview | null) => void;
  disabled?: boolean;
}

// Allows to attach an image to the ai assistant chat.
export function AttachImageInput({
  value,
  onChange,
  disabled,
}: AttachImageInputProps) {
  const t = useTranslations("Chat");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  return (
    <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="rounded-full"
        >
          <PaperclipIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("attachTitle")}</DialogTitle>
          <DialogDescription>{t("attachDescription")}</DialogDescription>
        </DialogHeader>

        <ImageUpload
          id="image"
          maxImages={1}
          handleImages={(images) => {
            if (images.length > 0) {
              const image = images[0];
              onChange(image || null);
              setImageDialogOpen(false);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
