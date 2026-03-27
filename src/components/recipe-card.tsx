"use client";
import type { Recipe } from "generated/prisma/client";
import { EllipsisVerticalIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { RecipeLikeButton } from "./recipe-like-button";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface RecipeCardProps {
  recipe: Recipe;
  isEditable?: boolean;
}

export function RecipeCard({ recipe, isEditable = false }: RecipeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRecipe = api.recipes.delete.useMutation();
  const router = useRouter();

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
                  onClick={handleDelete}
                  disabled={isDeleting}
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
            />
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {recipe.description}
          </CardDescription>
        </Link>
      </CardHeader>
    </Card>
  );
}
