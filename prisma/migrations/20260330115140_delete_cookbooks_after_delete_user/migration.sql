/*
  Warnings:

  - Made the column `authorId` on table `cookbook` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "cookbook" DROP CONSTRAINT "cookbook_authorId_fkey";

-- AlterTable
ALTER TABLE "cookbook" ALTER COLUMN "authorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "cookbook" ADD CONSTRAINT "cookbook_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
