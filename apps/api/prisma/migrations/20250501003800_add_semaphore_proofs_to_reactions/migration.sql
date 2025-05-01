/*
  Warnings:

  - You are about to drop the column `anonymous_metadata` on the `post_replies` table. All the data in the column will be lost.
  - You are about to drop the column `anonymous_metadata` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `reactions` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `publicKey` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "post_replies" DROP COLUMN "anonymous_metadata",
ADD COLUMN     "signature_metadata" JSONB,
ADD COLUMN     "signed_by_key_id" UUID;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "anonymous_metadata",
DROP COLUMN "reactions",
ADD COLUMN     "signature_metadata" JSONB,
ADD COLUMN     "signed_by_key_id" UUID;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "publicKey";

-- CreateTable
CREATE TABLE "reactions" (
    "id" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "proof_metadata_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "post_id" UUID,
    "reply_id" UUID,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semaphore_proof_metadata" (
    "id" UUID NOT NULL,
    "proof" TEXT NOT NULL,
    "nullifier" TEXT NOT NULL,
    "publicSignals" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "post_id" UUID,
    "reply_id" UUID,

    CONSTRAINT "semaphore_proof_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_public_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "publicKey" TEXT NOT NULL,
    "is_deactivated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivated_at" TIMESTAMPTZ,

    CONSTRAINT "user_public_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reactions_proof_metadata_id_key" ON "reactions"("proof_metadata_id");

-- CreateIndex
CREATE INDEX "reactions_post_id_idx" ON "reactions"("post_id");

-- CreateIndex
CREATE INDEX "reactions_reply_id_idx" ON "reactions"("reply_id");

-- CreateIndex
CREATE UNIQUE INDEX "semaphore_proof_metadata_nullifier_key" ON "semaphore_proof_metadata"("nullifier");

-- CreateIndex
CREATE UNIQUE INDEX "semaphore_proof_metadata_post_id_key" ON "semaphore_proof_metadata"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "semaphore_proof_metadata_reply_id_key" ON "semaphore_proof_metadata"("reply_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_public_keys_publicKey_key" ON "user_public_keys"("publicKey");

-- CreateIndex
CREATE INDEX "user_public_keys_user_id_is_deactivated_idx" ON "user_public_keys"("user_id", "is_deactivated");

-- CreateIndex
CREATE INDEX "post_replies_signed_by_key_id_idx" ON "post_replies"("signed_by_key_id");

-- CreateIndex
CREATE INDEX "posts_signed_by_key_id_idx" ON "posts"("signed_by_key_id");

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_proof_metadata_id_fkey" FOREIGN KEY ("proof_metadata_id") REFERENCES "semaphore_proof_metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "post_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semaphore_proof_metadata" ADD CONSTRAINT "semaphore_proof_metadata_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semaphore_proof_metadata" ADD CONSTRAINT "semaphore_proof_metadata_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "post_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_signed_by_key_id_fkey" FOREIGN KEY ("signed_by_key_id") REFERENCES "user_public_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_signed_by_key_id_fkey" FOREIGN KEY ("signed_by_key_id") REFERENCES "user_public_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_public_keys" ADD CONSTRAINT "user_public_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
