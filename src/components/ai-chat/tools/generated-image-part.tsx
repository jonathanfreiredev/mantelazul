"use client";

import Image from "next/image";
import { type ToolPart } from "./tool-part";

interface GeneratedImagePartProps {
  part: ToolPart<"generateRecipeImage">;
}

/**
 * Shows the image produced by the image generation tool. Waits for an actual URL: while the
 * tool is running, or when it fails, `output.imageUrl` is unavailable or undefined.
 */
export function GeneratedImagePart({ part }: GeneratedImagePartProps) {
  if (part.state !== "output-available") return null;
  if (!("imageUrl" in part.output) || !part.output.imageUrl) return null;

  return (
    <div className="relative mb-5 h-32 w-full overflow-hidden rounded-sm bg-gray-100 shadow-lg shadow-gray-500/50">
      <Image
        src={part.output.imageUrl}
        alt={part.input.recipeTitle}
        fill
        className="object-cover"
      />
    </div>
  );
}
