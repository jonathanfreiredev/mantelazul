"use client";
import { BookmarkIcon } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "../ui/item";

interface SaveRecipeButtonProps {
  recipeId: string;
  className?: string;
  positionIcon?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "base" | "lg" | "xl";
  isLoggedIn: boolean;
}

export function SaveRecipeButton({
  recipeId,
  className,
  positionIcon = "right",
  size = "base",
  isLoggedIn,
}: SaveRecipeButtonProps) {
  const [openCookbooksModal, setOpenCookbooksModal] = useState(false);

  const router = useRouter();
  const utils = api.useUtils();

  const { data: cookbooks, isLoading: cookbooksLoading } =
    api.cookbooks.getAllCookbooksByRecipeId.useQuery(
      {
        recipeId,
      },
      {
        enabled: isLoggedIn,
      },
    );

  const toogleSaveToCookbook = api.cookbooks.toogleRecipe.useMutation({
    onSuccess: () => {
      utils.cookbooks.getAllCookbooksByRecipeId.invalidate({ recipeId });
    },
  });

  return (
    <>
      <motion.div
        key="edit-recipe-button"
        initial={{ scale: 1 }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        whileTap={{ opacity: 0.6, scale: 0.9 }}
        className={cn(
          "flex cursor-pointer items-center gap-1 transition-colors",
          positionIcon === "top" || positionIcon === "bottom"
            ? "flex-col"
            : "flex-row",
          className ? className : "text-sm",
        )}
        onClick={async (e) => {
          if (!isLoggedIn) {
            router.push("/login");
            return;
          }

          setOpenCookbooksModal(true);
        }}
      >
        <span
          className={cn(
            positionIcon === "top" || positionIcon === "left" ? "order-2" : "",
          )}
        >
          save
        </span>
        <BookmarkIcon
          fill="none"
          className={
            size === "sm"
              ? "size-4"
              : size === "lg"
                ? "size-7"
                : size === "xl"
                  ? "size-8"
                  : size === "base"
                    ? "size-6"
                    : "size-5"
          }
        />
      </motion.div>

      <Dialog
        open={openCookbooksModal}
        onOpenChange={(open) => {
          setOpenCookbooksModal(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a cookbook to save this recipe</DialogTitle>
          </DialogHeader>

          {!cookbooksLoading && cookbooks && (
            <>
              {cookbooks.length > 0 ? (
                <ItemGroup className="w-full">
                  {cookbooks.map((cookbook) => (
                    <Item key={cookbook.id} variant="outline">
                      <ItemContent>
                        <ItemTitle>{cookbook.name}</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          variant="outline"
                          size="icon-lg"
                          disabled={toogleSaveToCookbook.isPending}
                          onClick={async () => {
                            console.log("Saving recipe to cookbook", {
                              cookbookId: cookbook.id,
                              recipeId,
                            });
                            await toogleSaveToCookbook.mutateAsync({
                              cookbookId: cookbook.id,
                              recipeId,
                            });
                          }}
                        >
                          <BookmarkIcon
                            fill={cookbook.hasRecipe ? "true" : "none"}
                          />
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <p>You don't have any cookbooks yet.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
