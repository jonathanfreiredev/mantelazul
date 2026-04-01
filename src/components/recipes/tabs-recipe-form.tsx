"use client";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "~/hooks/use-media-query";
import { cn } from "~/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface BreadcrumbRecipeFormProps {
  recipeSlug: string;
  formType: "create" | "update";
  step: "details" | "ingredients" | "steps" | "tags";
  children?: React.ReactNode;
}

export function TabsRecipeForm({
  recipeSlug,
  formType,
  step,
  children,
}: BreadcrumbRecipeFormProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const router = useRouter();

  const containerStyle = isDesktop
    ? "flex-row items-start justify-center"
    : "flex-col items-center";

  return (
    <div
      className={cn(
        "bg-muted flex min-h-svh gap-4 p-6 md:p-10",
        containerStyle,
      )}
    >
      <Tabs
        orientation={isDesktop ? "vertical" : "horizontal"}
        defaultValue={step}
        className="rounded-lg border"
      >
        <TabsList>
          <TabsTrigger
            value="details"
            disabled={formType === "create"}
            onClick={() => {
              router.push(`/recipes/${recipeSlug}/update`);
            }}
          >
            Details
          </TabsTrigger>

          <TabsTrigger
            value="ingredients"
            disabled={formType === "create"}
            onClick={() => {
              router.push(`/recipes/${recipeSlug}/update/ingredients`);
            }}
          >
            Ingredients
          </TabsTrigger>

          <TabsTrigger
            value="steps"
            disabled={formType === "create"}
            onClick={() => {
              router.push(`/recipes/${recipeSlug}/update/steps`);
            }}
          >
            Steps
          </TabsTrigger>

          <TabsTrigger
            value="tags"
            disabled={formType === "create"}
            onClick={() => {
              router.push(`/recipes/${recipeSlug}/update/tags`);
            }}
          >
            Tags
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}
