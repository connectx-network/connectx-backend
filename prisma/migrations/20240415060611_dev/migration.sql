-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserCodeType" AS ENUM ('VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVENT_INVITATION', 'EVENT_LIKED', 'EVENT_JOINED', 'NEW_FOLLOWER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EventAssetType" AS ENUM ('BACKGROUND', 'IMAGE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "full_name" TEXT NOT NULL,
    "nickname" TEXT,
    "description" TEXT,
    "country" TEXT,
    "phone_number" TEXT,
    "company" TEXT,
    "gender" "Gender",
    "address" TEXT,
    "avatar_url" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "userRole" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_token" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_token" TEXT,
    "refresh_token" TEXT NOT NULL,
    "expired_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_verification " (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "verify_code" TEXT NOT NULL,
    "expired_date" TIMESTAMP(3) NOT NULL,
    "type" "UserCodeType" NOT NULL,

    CONSTRAINT "user_verification _pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_connection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "follow_user_id" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "follow_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "event_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "tiket_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_end_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "sponsors" TEXT,
    "agenda" TEXT,
    "speakers" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_location_detail" (
    "id" TEXT NOT NULL,
    "latitude" TEXT NOT NULL,
    "longitude" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "event_location_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_host" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "event_host_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_asset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "EventAssetType" NOT NULL,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "event_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "joined_event_user" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_in_date" TIMESTAMP(3),
    "checked_in" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "joined_event_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "object_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "status" "NotificationStatus" NOT NULL DEFAULT 'ACTIVE',
    "notification_type" "NotificationType" NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTCollection" (
    "id" TEXT NOT NULL,
    "nft_collection _address" TEXT,
    "owner_address" TEXT NOT NULL,
    "royalty_percent" TEXT NOT NULL,
    "royalty_address" TEXT NOT NULL,
    "next_item_index" TEXT NOT NULL,
    "collection_content_url" TEXT,
    "common_content_url" TEXT,
    "event_id" TEXT,

    CONSTRAINT "NFTCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTItem" (
    "id" TEXT NOT NULL,
    "item_owner_address" TEXT NOT NULL,
    "item_index" INTEGER NOT NULL,
    "common_content_url" TEXT NOT NULL,
    "nft_collection_id" TEXT NOT NULL,
    "query_id" INTEGER,
    "amount" BIGINT NOT NULL,

    CONSTRAINT "NFTItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_token_id_key" ON "user_token"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_verification _id_key" ON "user_verification "("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_verification _user_id_key" ON "user_verification "("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_verification _verify_code_key" ON "user_verification "("verify_code");

-- CreateIndex
CREATE UNIQUE INDEX "user_verification _user_id_type_key" ON "user_verification "("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "user_interest_id_key" ON "user_interest"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_interest_user_id_name_key" ON "user_interest"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_image_id_key" ON "user_image"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_connection_id_key" ON "user_connection"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_connection_user_id_follow_user_id_key" ON "user_connection"("user_id", "follow_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_category_id_key" ON "event_category"("id");

-- CreateIndex
CREATE UNIQUE INDEX "event_id_key" ON "event"("id");

-- CreateIndex
CREATE UNIQUE INDEX "event_shortId_key" ON "event"("shortId");

-- CreateIndex
CREATE UNIQUE INDEX "event_location_detail_id_key" ON "event_location_detail"("id");

-- CreateIndex
CREATE UNIQUE INDEX "event_location_detail_event_id_key" ON "event_location_detail"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_host_id_key" ON "event_host"("id");

-- CreateIndex
CREATE UNIQUE INDEX "event_asset_id_key" ON "event_asset"("id");

-- CreateIndex
CREATE UNIQUE INDEX "joined_event_user_id_key" ON "joined_event_user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "joined_event_user_user_id_event_id_key" ON "joined_event_user"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_id_key" ON "notification"("id");

-- CreateIndex
CREATE UNIQUE INDEX "NFTCollection_id_key" ON "NFTCollection"("id");

-- CreateIndex
CREATE UNIQUE INDEX "NFTCollection_event_id_key" ON "NFTCollection"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "NFTItem_id_key" ON "NFTItem"("id");

-- AddForeignKey
ALTER TABLE "user_token" ADD CONSTRAINT "user_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_verification " ADD CONSTRAINT "user_verification _user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interest" ADD CONSTRAINT "user_interest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_image" ADD CONSTRAINT "user_image_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_connection" ADD CONSTRAINT "user_connection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_connection" ADD CONSTRAINT "user_connection_follow_user_id_fkey" FOREIGN KEY ("follow_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_location_detail" ADD CONSTRAINT "event_location_detail_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_host" ADD CONSTRAINT "event_host_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_asset" ADD CONSTRAINT "event_asset_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "joined_event_user" ADD CONSTRAINT "joined_event_user_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "joined_event_user" ADD CONSTRAINT "joined_event_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTCollection" ADD CONSTRAINT "NFTCollection_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTItem" ADD CONSTRAINT "NFTItem_nft_collection_id_fkey" FOREIGN KEY ("nft_collection_id") REFERENCES "NFTCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
