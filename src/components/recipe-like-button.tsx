"use client";
import { HeartIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface RecipeLikeButtonProps {
  recipeId: string;
  className?: string;
  positionIcon?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "base" | "lg" | "xl";
}

export function RecipeLikeButton({
  recipeId,
  className,
  positionIcon = "right",
  size = "base",
}: RecipeLikeButtonProps) {
  const utils = api.useUtils();

  const toggleLike = api.likes.toggleLike.useMutation({
    onMutate: async () => {
      await utils.likes.isLikedByUser.cancel();

      const prev = utils.likes.isLikedByUser.getData({ recipeId });

      utils.likes.isLikedByUser.setData({ recipeId }, (old) => ({
        isLiked: !old?.isLiked,
        likesCount: old?.isLiked
          ? (old.likesCount || 1) - 1
          : (old?.likesCount || 0) + 1,
      }));

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        utils.likes.isLikedByUser.setData({ recipeId }, context.prev);
      }
    },
    onSettled: () => {
      utils.likes.isLikedByUser.invalidate();
    },
  });

  const { data: likeData, isLoading: likeLoading } =
    api.likes.isLikedByUser.useQuery({ recipeId });

  if (likeLoading || !likeData) return null;

  const isLiked = likeData.isLiked;
  const likesCount = likeData.likesCount;

  return (
    <motion.div
      key={isLiked ? "liked" : "not-liked"}
      initial={{ scale: 1 }}
      animate={{
        scale: isLiked ? [1, 1.4, 1] : 1,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      whileTap={{ scale: 0.8 }}
      className={cn(
        "flex items-center gap-1",
        positionIcon === "top" || positionIcon === "bottom"
          ? "flex-col"
          : "flex-row",
        className ? className : "text-sm",
      )}
      onClick={async (e) => {
        if (toggleLike.isPending) return;

        e.preventDefault();
        toggleLike.mutate({ recipeId });
      }}
    >
      <span
        className={cn(
          positionIcon === "top" || positionIcon === "left" ? "order-2" : "",
        )}
      >
        {likesCount}
      </span>

      <HeartIcon
        fill={isLiked ? "red" : "none"}
        className={cn(
          "transition-colors",
          size === "sm"
            ? "size-4"
            : size === "lg"
              ? "size-7"
              : size === "xl"
                ? "size-8"
                : size === "base"
                  ? "size-6"
                  : "size-5",
          isLiked ? "text-red-500" : "",
        )}
      />
    </motion.div>
  );
}
