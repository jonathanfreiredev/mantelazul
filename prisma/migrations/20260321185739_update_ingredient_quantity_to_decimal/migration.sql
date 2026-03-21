/*
  Warnings:

  - Changed the type of `quantity` on the `ingredient` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ingredient" DROP COLUMN "quantity",
ADD COLUMN     "quantity" DECIMAL(10,3) NOT NULL;
