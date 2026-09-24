"use client";

import Image from "next/image";

interface RecipeResultHeaderProps {
  /** Recipe title, shown to the right of the thumbnail. */
  title: string;
  /** Recipe image; when missing, only the title is shown. */
  imageUrl: string | null;
  /** Short line describing the outcome, e.g. "created successfully". */
  caption: string;
}

/**
 * Header of a recipe create/update result: a square thumbnail on the left and the title (plus
 * a short caption) on the right. Falls back to a title-only layout when the recipe has no image.
 */
export function RecipeResultHeader({
  title,
  imageUrl,
  caption,
}: RecipeResultHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {imageUrl && (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
          <Image src={imageUrl} alt={title} fill className="object-cover" />
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="text-sm opacity-70">{caption}</p>
      </div>
    </div>
  );
}
