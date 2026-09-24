"use client";

import Image from "next/image";

interface MessagePartProps {
  part:
    | { type: "text"; text: string }
    | { type: "file"; url: string; mediaType: string; filename?: string };
  partIndex: number;
}

/**
 * Renders the non-tool parts of a message: plain text and attached files (images).
 * Kept separate from the tool renderers so tool state keeps its own typed access.
 */
export function MessagePart({ part, partIndex }: MessagePartProps) {
  if (part.type === "text") {
    return (
      <div className="wrap-break-word whitespace-pre-wrap">{part.text}</div>
    );
  }

  const isImage = part.mediaType.startsWith("image/");
  if (!isImage) return null;

  return (
    <div className="mt-2">
      <div className="relative h-32 w-32 overflow-hidden rounded-sm bg-gray-100 shadow-lg shadow-gray-500/50">
        <Image
          src={part.url}
          alt={part.filename ?? `Attached image ${partIndex + 1}`}
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}
