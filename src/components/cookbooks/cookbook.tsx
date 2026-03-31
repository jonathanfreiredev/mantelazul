"use client";
import Image from "next/image";
import { api } from "~/trpc/react";
import { Recipes } from "../recipes";
import { Separator } from "../ui/separator";

interface CookbookProps {
  cookbookId: string;
}

export function Cookbook({ cookbookId }: CookbookProps) {
  const {
    data: resCookbook,
    isLoading,
    isError,
  } = api.cookbooks.getOne.useQuery({
    id: cookbookId,
  });

  if (isLoading || isError || !resCookbook) return null;

  const cookbook = resCookbook;

  return (
    <div className="mx-auto flex w-full max-w-230 flex-col items-center sm:px-10">
      <div className="relative aspect-4/3 w-full overflow-hidden sm:rounded-lg">
        {cookbook.images.length === 1 ? (
          <Image
            src={cookbook.images[0]!}
            alt="Event cover"
            fill
            className="object-cover"
          />
        ) : cookbook.images.length === 2 ? (
          <div className="absolute grid h-full w-full grid-cols-2">
            <div className="relative">
              <Image
                src={cookbook.images[0]!}
                alt="Event cover"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative">
              <Image
                src={cookbook.images[1]!}
                alt="Event cover"
                fill
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          cookbook.images.length > 2 && (
            <div className="absolute grid h-full w-full grid-cols-2 grid-rows-2">
              <div className="relative row-span-2">
                <Image
                  src={cookbook.images[0]!}
                  alt="Event cover"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative">
                <Image
                  src={cookbook.images[1]!}
                  alt="Event cover"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative">
                <Image
                  src={cookbook.images[2]!}
                  alt="Event cover"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )
        )}
      </div>
      <div className="my-6 flex w-full flex-col items-center justify-between p-5 sm:p-0">
        <h2 className="nowrap line-clamp-2 text-3xl font-bold">
          {cookbook.name}
        </h2>

        <Separator className="my-6 w-full" />

        <Recipes cookbookId={cookbookId} isEditable />
      </div>
    </div>
  );
}
