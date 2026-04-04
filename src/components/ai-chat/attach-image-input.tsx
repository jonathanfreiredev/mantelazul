"use client";
import { PaperclipIcon } from "lucide-react";
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
          <DialogTitle>Attach an image to the chat</DialogTitle>
          <DialogDescription>
            The image will be sent to the AI assistant and can be used in the
            conversation.
          </DialogDescription>
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
