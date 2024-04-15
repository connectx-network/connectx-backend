/*
  Warnings:

  - Added the required column `description` to the `NftCollection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `NftCollection` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `royalty_percent` on the `NftCollection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `next_item_index` on the `NftCollection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "NftCollection" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "socialLinks" TEXT[],
DROP COLUMN "royalty_percent",
ADD COLUMN     "royalty_percent" INTEGER NOT NULL,
DROP COLUMN "next_item_index",
ADD COLUMN     "next_item_index" INTEGER NOT NULL;
