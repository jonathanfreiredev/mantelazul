import { deleteImageByUrl } from "~/server/api/routers/images/service";
import { db } from "~/server/db";
import { removeRecipeIndex } from "~/server/rag/sync";

/**
 * Removes the likes the user left behind and corrects the denormalized `likesCount` of every
 * recipe they had liked. The cascade on `RecipeLike.userId` would delete the rows, but the recipe
 * survives an account deletion, so the counter has to be recomputed here or it drifts.
 */
export async function clearRecipeLikes(userId: string): Promise<void> {
  const likes = await db.recipeLike.findMany({
    where: { userId },
    select: { recipeId: true },
  });

  const recipeIds = [...new Set(likes.map((like) => like.recipeId))];

  if (recipeIds.length === 0) return;

  await db.$transaction(async (tx) => {
    await tx.recipeLike.deleteMany({ where: { userId } });

    for (const recipeId of recipeIds) {
      const likesCount = await tx.recipeLike.count({ where: { recipeId } });

      await tx.recipe.update({
        where: { id: recipeId },
        data: { likesCount },
      });
    }
  });
}

/**
 * Deletes the recipes the user never published, with their images. An unpublished recipe with no
 * author is invisible to everybody (`published: false` matches no listing and no search), so it
 * would only rot in the database, Cloudinary and the vector index.
 *
 * Published recipes are left alone: they are public content that other users may have in a
 * cookbook, liked or planned.
 */
export async function deleteUnpublishedRecipes(userId: string): Promise<number> {
  const recipes = await db.recipe.findMany({
    where: { authorId: userId, published: false },
    select: {
      id: true,
      imageUrl: true,
      steps: { select: { imageUrl: true } },
    },
  });

  for (const recipe of recipes) {
    if (recipe.imageUrl) await deleteImageByUrl(recipe.imageUrl);

    for (const step of recipe.steps) {
      if (step.imageUrl) await deleteImageByUrl(step.imageUrl);
    }

    await db.recipe.delete({ where: { id: recipe.id } });
    await removeRecipeIndex(recipe.id);
  }

  return recipes.length;
}

/**
 * Revokes the pending invitations addressed to the user's email, so an account created later with
 * that same address cannot join the household through an old invitation. `HouseholdInvite.email`
 * is stored lowercased while `User.email` keeps whatever casing the user typed, hence the
 * insensitive match.
 */
export async function revokePendingInvitesForEmail(
  email: string,
): Promise<number> {
  const { count } = await db.householdInvite.updateMany({
    where: {
      email: { equals: email, mode: "insensitive" },
      status: "PENDING",
    },
    data: { status: "REVOKED" },
  });

  return count;
}
