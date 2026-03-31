import type { Step, Tag } from "generated/prisma/client";
import Image from "next/image";

interface TagsSectionProps {
  tags: Tag[];
}

export function TagsSection({ tags }: TagsSectionProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-2xl font-semibold">Tags</h3>

      <div className="flex w-full flex-wrap gap-4">
        {tags.map((tag) => (
          <span key={tag.id} className="block text-gray-700">
            #{tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
