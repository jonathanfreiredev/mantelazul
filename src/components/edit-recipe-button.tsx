"use client";
import { SquarePenIcon } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";

interface EditRecipeButtonProps {
  recipeSlug: string;
  className?: string;
  positionIcon?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "base" | "lg" | "xl";
}

export function EditRecipeButton({
  recipeSlug,
  className,
  positionIcon = "right",
  size = "base",
}: EditRecipeButtonProps) {
  const router = useRouter();

  return (
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
      onClick={() => {
        router.push(`/recipes/${recipeSlug}/update`);
      }}
    >
      <span
        className={cn(
          positionIcon === "top" || positionIcon === "left" ? "order-2" : "",
        )}
      >
        edit
      </span>
      <SquarePenIcon
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
  );
}
