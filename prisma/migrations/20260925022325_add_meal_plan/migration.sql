-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "householdId" TEXT;

-- CreateTable
CREATE TABLE "household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "householdId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,

    CONSTRAINT "household_invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_entry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "servings" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "householdId" TEXT,
    "recipeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "meal_plan_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "household_ownerId_key" ON "household"("ownerId");

-- CreateIndex
CREATE INDEX "household_name_idx" ON "household"("name");

-- CreateIndex
CREATE UNIQUE INDEX "household_invite_token_key" ON "household_invite"("token");

-- CreateIndex
CREATE INDEX "household_invite_email_idx" ON "household_invite"("email");

-- CreateIndex
CREATE INDEX "household_invite_householdId_idx" ON "household_invite"("householdId");

-- CreateIndex
CREATE INDEX "meal_plan_entry_householdId_date_idx" ON "meal_plan_entry"("householdId", "date");

-- CreateIndex
CREATE INDEX "meal_plan_entry_createdById_date_idx" ON "meal_plan_entry"("createdById", "date");

-- CreateIndex
CREATE INDEX "meal_plan_entry_recipeId_idx" ON "meal_plan_entry"("recipeId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household" ADD CONSTRAINT "household_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_invite" ADD CONSTRAINT "household_invite_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_invite" ADD CONSTRAINT "household_invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
