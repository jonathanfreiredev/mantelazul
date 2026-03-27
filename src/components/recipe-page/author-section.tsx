"use client";

import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";

interface AuthorSectionProps {
  authorId: string;
}

export function AuthorSection({ authorId }: AuthorSectionProps) {
  const {
    data: resAuthor,
    isLoading,
    isError,
  } = api.users.getAuthor.useQuery({ authorId });

  if (isError) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {resAuthor ? (
          <Avatar className="h-12 w-12">
            <AvatarImage src="" alt="author" className="grayscale" />
            <AvatarFallback className="bg-slate-100">
              {resAuthor.name.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Skeleton className="h-12 w-12 rounded-full" />
        )}

        <div className="flex flex-col gap-2">
          {resAuthor ? (
            <>
              <span className="text-sm font-medium text-gray-900">
                {resAuthor.name}
              </span>
              <span className="text-sm text-gray-500">
                Food Editor at Saborio
              </span>{" "}
            </>
          ) : (
            <>
              <Skeleton className="h-4 w-50" />
              <Skeleton className="h-4 w-50" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
