"use client";
import type { Recipe } from "generated/prisma/client";
import { EllipsisVerticalIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { RecipeLikeButton } from "./recipe-like-button";
import { RecipePublishButton } from "./recipe-publish-button";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";

interface RecipeCardProps {
  recipe: Recipe;
  isEditable?: boolean;
}

export function RecipeCard({ recipe, isEditable = false }: RecipeCardProps) {
  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRecipe = api.recipes.delete.useMutation();
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  const handleDelete = async () => {
    if (!isEditable) return;

    setIsDeleting(true);
    const res = await deleteRecipe.mutateAsync({ id: recipe.id });

    if (res.success) {
      router.refresh();
      toast.success("Recipe deleted successfully");
    } else {
      toast.error("Failed to delete recipe");
    }
    setIsDeleting(false);
  };

  if (isPending) return null;

  const isLoggedIn = !!data?.session;

  return (
    <Card className="relative w-full rounded-sm pt-0">
      <div className="relative h-48 w-full overflow-hidden rounded-t-sm bg-gray-300 2xl:h-56">
        {recipe.imageUrl && (
          <Image
            src={recipe.imageUrl}
            alt="Event cover"
            fill
            className="object-cover"
          />
        )}
        {isEditable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="absolute right-0 z-10 m-2">
              <Button variant="secondary" size="icon-lg" color="red">
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild disabled={isDeleting}>
                  <Link href={`/recipes/${recipe.slug}/update`}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => setOpenDelete(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <CardHeader>
        <Link href={`/recipes/${recipe.slug}`}>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="nowrap line-clamp-1">{recipe.title}</div>

            <RecipeLikeButton
              recipeId={recipe.id}
              size="md"
              className="text-md"
              isLoggedIn={isLoggedIn}
            />
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {recipe.description}
          </CardDescription>
        </Link>
      </CardHeader>

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-end">
            <DialogClose asChild>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Delete
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoggedIn && data.user.id === recipe.authorId && (
        <div className="flex flex-col px-4">
          <Separator className="my-4" />

          <div className="pt-2">
            <RecipePublishButton recipeId={recipe.id} />
          </div>
        </div>
      )}
    </Card>
  );
}
