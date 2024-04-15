/*
  Warnings:

  - You are about to drop the `NFTCollection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NFTItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NFTCollection" DROP CONSTRAINT "NFTCollection_event_id_fkey";

-- DropForeignKey
ALTER TABLE "NFTItem" DROP CONSTRAINT "NFTItem_nft_collection_id_fkey";

-- DropTable
DROP TABLE "NFTCollection";

-- DropTable
DROP TABLE "NFTItem";

-- CreateTable
CREATE TABLE "NftCollection" (
    "id" TEXT NOT NULL,
    "nft_collection _address" TEXT,
    "owner_address" TEXT NOT NULL,
    "royalty_percent" TEXT NOT NULL,
    "royalty_address" TEXT NOT NULL,
    "next_item_index" TEXT NOT NULL,
    "collection_content_url" TEXT,
    "common_content_url" TEXT,
    "event_id" TEXT,

    CONSTRAINT "NftCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftItem" (
    "id" TEXT NOT NULL,
    "item_owner_address" TEXT NOT NULL,
    "item_index" INTEGER NOT NULL,
    "common_content_url" TEXT NOT NULL,
    "nft_collection_id" TEXT NOT NULL,
    "query_id" INTEGER,
    "amount" BIGINT NOT NULL,

    CONSTRAINT "NftItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NftCollection_id_key" ON "NftCollection"("id");

-- CreateIndex
CREATE UNIQUE INDEX "NftCollection_event_id_key" ON "NftCollection"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "NftItem_id_key" ON "NftItem"("id");

-- AddForeignKey
ALTER TABLE "NftCollection" ADD CONSTRAINT "NftCollection_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftItem" ADD CONSTRAINT "NftItem_nft_collection_id_fkey" FOREIGN KEY ("nft_collection_id") REFERENCES "NftCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
