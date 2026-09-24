"use client";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { CreateCookbookForm } from "./create-cookbook-form";
import { CookbookCard } from "./cookbook-card";

export function Cookbooks() {
  const t = useTranslations("Cookbook");
  const [cookbooks] = api.cookbooks.getAll.useSuspenseQuery();

  return (
    <div className="flex w-full flex-col items-center px-5 sm:px-10">
      <div className="flex w-full items-center justify-between">
        <div className="text-muted-foreground my-4 mt-7 self-start text-sm">
          {t("count", { count: cookbooks.length })}
        </div>

        <CreateCookbookForm />
      </div>

      <div className="mb-10 grid w-full max-w-400 grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {cookbooks.map((cookbook) => (
          <CookbookCard key={cookbook.id} cookbook={cookbook} />
        ))}
      </div>

      {cookbooks.length === 0 && (
        <div className="mb-10 flex h-full w-full items-center justify-center">
          <p className="text-muted-foreground text-center">{t("noCookbooks")}</p>
        </div>
      )}
    </div>
  );
}
