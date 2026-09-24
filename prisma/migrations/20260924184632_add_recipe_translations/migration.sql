-- CreateTable
CREATE TABLE "recipe_translation" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_translation_locale_title_idx" ON "recipe_translation"("locale", "title");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_translation_recipeId_locale_key" ON "recipe_translation"("recipeId", "locale");

-- AddForeignKey
ALTER TABLE "recipe_translation" ADD CONSTRAINT "recipe_translation_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "recipe" ADD COLUMN "sourceLocale" TEXT NOT NULL DEFAULT 'en';

-- DataMigration
-- Every recipe that exists today was authored in Spanish. Before dropping the source columns,
-- copy the current text into the authoritative 'es' translation row of each recipe. Ingredient
-- and step text is stored as an ordered JSON array so it survives the structural deletes the
-- update flow performs. Ids are generated with md5 (no extension needed on any Postgres 13+).
INSERT INTO "recipe_translation" (
    "id",
    "recipeId",
    "locale",
    "title",
    "description",
    "ingredients",
    "steps",
    "createdAt",
    "updatedAt"
)
SELECT
    md5(random()::text || clock_timestamp()::text || r."id"),
    r."id",
    'es',
    r."title",
    r."description",
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object('order', i."order", 'name', i."name")
                ORDER BY i."order"
            )
            FROM "ingredient" i
            WHERE i."recipeId" = r."id"
        ),
        '[]'::jsonb
    ),
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object('order', s."order", 'description', s."description")
                ORDER BY s."order"
            )
            FROM "step" s
            WHERE s."recipeId" = r."id"
        ),
        '[]'::jsonb
    ),
    now(),
    now()
FROM "recipe" r;

UPDATE "recipe" SET "sourceLocale" = 'es';

-- DropIndex
DROP INDEX "ingredient_name_idx";

-- DropIndex
DROP INDEX "recipe_title_idx";

-- AlterTable
ALTER TABLE "ingredient" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "recipe" DROP COLUMN "description",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "step" DROP COLUMN "description";
