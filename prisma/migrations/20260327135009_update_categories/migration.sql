/*
  Warnings:

  - The values [SIDE_DISH] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('MAIN_COURSE', 'DESSERT', 'DRINK', 'STARTER', 'SNACK', 'BREAKFAST');
ALTER TABLE "public"."recipe" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "recipe" ALTER COLUMN "category" TYPE "Category_new" USING ("category"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "public"."Category_old";
ALTER TABLE "recipe" ALTER COLUMN "category" SET DEFAULT 'MAIN_COURSE';
COMMIT;
