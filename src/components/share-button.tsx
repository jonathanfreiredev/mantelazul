"use client";
import { CopyIcon, Share2Icon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";

interface ShareButtonProps {
  recipeSlug: string;
  className?: string;
  positionIcon?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "base" | "lg" | "xl";
}

export function ShareButton({
  recipeSlug,
  className,
  positionIcon = "right",
  size = "base",
}: ShareButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          key="share-button"
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
        >
          <span
            className={cn(
              positionIcon === "top" || positionIcon === "left"
                ? "order-2"
                : "",
            )}
          >
            share
          </span>
          <Share2Icon
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
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              const url = `${window.location.origin}/recipes/${recipeSlug}`;
              navigator.clipboard.writeText(url);

              toast.success("Recipe URL copied to clipboard");
            }}
          >
            <CopyIcon className="size-4" />
            Copy
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
