-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "email" TEXT,
    "publicKey" TEXT[],
    "website" TEXT,
    "bio" TEXT,
    "is_anon" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocols" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "protocol_id" UUID NOT NULL,
    "metadata" JSONB,
    "private_by_default" BOOLEAN NOT NULL DEFAULT true,
    "expires_after" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "is_public" BOOLEAN NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "is_private" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_required_badges" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "requirements" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_required_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "is_anon" BOOLEAN NOT NULL DEFAULT false,
    "anonymous_metadata" JSONB,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "reactions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_replies" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "post_id" UUID NOT NULL,
    "author_id" UUID,
    "reply_parent_id" UUID,
    "is_anon" BOOLEAN NOT NULL DEFAULT false,
    "anonymous_metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "post_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "protocols_slug_key" ON "protocols"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE INDEX "user_badges_user_id_badge_id_idx" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "community_required_badges_community_id_badge_id_idx" ON "community_required_badges"("community_id", "badge_id");

-- CreateIndex
CREATE INDEX "community_members_community_id_user_id_idx" ON "community_members"("community_id", "user_id");

-- CreateIndex
CREATE INDEX "posts_community_id_created_at_idx" ON "posts"("community_id", "created_at");

-- CreateIndex
CREATE INDEX "posts_author_id_created_at_idx" ON "posts"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "post_replies_post_id_created_at_idx" ON "post_replies"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "post_replies_author_id_created_at_idx" ON "post_replies"("author_id", "created_at");

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_required_badges" ADD CONSTRAINT "community_required_badges_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_required_badges" ADD CONSTRAINT "community_required_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_reply_parent_id_fkey" FOREIGN KEY ("reply_parent_id") REFERENCES "post_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
