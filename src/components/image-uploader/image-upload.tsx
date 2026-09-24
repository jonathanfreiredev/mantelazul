"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "../ui/input";
import { processImage } from "~/lib/process-image";
import { Spinner } from "../ui/spinner";

export type ImageWithPreview = {
  file: File;
  preview: string;
};

type ImageUploadProps = {
  maxImages: number;
  handleImages: (images: ImageWithPreview[]) => void;
};

export function ImageUpload({
  handleImages,
  maxImages = 1,
  ...props
}: React.ComponentProps<"input"> & ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsLoading(true);
      try {
        const processedFiles = await Promise.all(
          acceptedFiles.map(async (file) => {
            try {
              return await processImage(file);
            } catch (e) {
              console.error("Error redimensionando:", e);
              return file;
            }
          }),
        );

        const newImages: ImageWithPreview[] = processedFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));

        handleImages(newImages);
      } finally {
        setIsLoading(false);
      }
    },
    [handleImages],
  );

  // react-dropzone expects a void handler; wrap the async work so the promise
  // is not passed through to a property that requires a void return.
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      void onDrop(acceptedFiles);
    },
    [onDrop],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [],
      "image/heif": [],
    },
    multiple: maxImages > 1,
    maxFiles: maxImages,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className="border-muted text-muted-foreground hover:bg-muted/50 focus:ring-ring data-[state=open]:bg-muted relative flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-3 border-dashed bg-transparent p-6 text-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed"
    >
      <Input
        {...props}
        {...getInputProps()}
        type="file"
        max={maxImages}
        accept="image/jpeg, image/png, image/webp, image/heic, image/heif"
        multiple={maxImages > 1}
        size={10 * 1024 * 1024}
      />
      <p>Drag 'n' drop an image here, or click to select an image</p>
      <Spinner
        className={`absolute ${isLoading ? "block" : "hidden"} size-10`}
      />
    </div>
  );
}
