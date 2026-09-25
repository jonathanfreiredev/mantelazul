"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { type ToolPart } from "./tool-part";

interface GeneratedImagePartProps {
  part: ToolPart<"generateRecipeImage">;
}

/**
 * Shows the image produced by the image generation tool. Waits for an actual URL: while the
 * tool is running, or when it fails, `output.imageUrl` is unavailable or undefined.
 *
 * The caption is not decoration: Article 50(4) of the EU AI Act requires a photorealistic
 * generated image to be disclosed as AI-generated.
 */
export function GeneratedImagePart({ part }: GeneratedImagePartProps) {
  const t = useTranslations("Chat");

  if (part.state !== "output-available") return null;
  if (!("imageUrl" in part.output) || !part.output.imageUrl) return null;

  return (
    <figure className="mb-5">
      <div className="relative h-32 w-full overflow-hidden rounded-sm bg-gray-100 shadow-lg shadow-gray-500/50">
        <Image
          src={part.output.imageUrl}
          alt={part.input.recipeTitle}
          fill
          className="object-cover"
        />
      </div>
      <figcaption className="mt-1 text-xs font-extralight opacity-70">
        {t("generatedImage")}
      </figcaption>
    </figure>
  );
}
