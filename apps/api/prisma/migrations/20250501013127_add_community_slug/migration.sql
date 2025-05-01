/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `communities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `communities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `merkle_root_id` to the `semaphore_proof_metadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "semaphore_proof_metadata" ADD COLUMN     "merkle_root_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "community_merkle_roots" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_merkle_roots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_merkle_roots_community_id_created_at_idx" ON "community_merkle_roots"("community_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");

-- AddForeignKey
ALTER TABLE "community_merkle_roots" ADD CONSTRAINT "community_merkle_roots_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semaphore_proof_metadata" ADD CONSTRAINT "semaphore_proof_metadata_merkle_root_id_fkey" FOREIGN KEY ("merkle_root_id") REFERENCES "community_merkle_roots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create the new join table
CREATE TABLE "protocol_badge_definitions" (
    "id" UUID NOT NULL,
    "protocol_id" UUID NOT NULL,
    "badge_definition_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "protocol_badge_definitions_pkey" PRIMARY KEY ("id")
);

-- Migrate existing relationships
INSERT INTO "protocol_badge_definitions" ("id", "protocol_id", "badge_definition_id", "created_at")
SELECT 
    gen_random_uuid(),
    "protocol_id",
    "id" as "badge_definition_id",
    CURRENT_TIMESTAMP
FROM "badge_definitions";

-- Add foreign key constraints
ALTER TABLE "protocol_badge_definitions" ADD CONSTRAINT "protocol_badge_definitions_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "protocol_badge_definitions" ADD CONSTRAINT "protocol_badge_definitions_badge_definition_id_fkey" FOREIGN KEY ("badge_definition_id") REFERENCES "badge_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add unique constraint to prevent duplicates
CREATE UNIQUE INDEX "protocol_badge_definitions_protocol_id_badge_definition_id_key" ON "protocol_badge_definitions"("protocol_id", "badge_definition_id");

-- Add indexes for performance
CREATE INDEX "protocol_badge_definitions_protocol_id_idx" ON "protocol_badge_definitions"("protocol_id");
CREATE INDEX "protocol_badge_definitions_badge_definition_id_idx" ON "protocol_badge_definitions"("badge_definition_id");

-- Drop the old column after data migration
ALTER TABLE "badge_definitions" DROP COLUMN "protocol_id";
