import { z } from "zod"
import { BadgeSchema } from "./badge"
import { CommunitySchema } from "./community"

export const postReactionSchema = z.object({
  emoji: z.string(),
  count: z.number().int().default(0),
  nullifiers: z.array(z.string()).optional().default([]),
})

export const postAuthorSchema = z
  .object({
    id: z.string().uuid().nullable(),
    username: z.string().nullable().optional(),
    isAnon: z.boolean().default(false),
    badges: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => (data?.isAnon ? data?.id === null : data?.id !== null),
    {
      message: "Id must be null when isAnon is true.",
      path: ["id"],
    },
  )

export const anonymousMetadataSchema = z.object({
  nullifier: z.string(),
  proof: z.string(),
  publicSignals: z.array(z.string()),
  // Add any other anonymous post specific metadata fields here
})

export const postReplySchema = z.object({
  id: z.string().uuid(),
  content: z.string().optional(),
  author: postAuthorSchema,
  createdAt: z.string().optional(),
  postMention: z.string().uuid().optional().nullable(),
  anonymousMetadata: anonymousMetadataSchema.optional(),
})

export const postSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  replies: z.array(
    postReplySchema.and(
      z.object({
        replies: z.array(postReplySchema).optional(),
      }),
    ),
  ),
  author: postAuthorSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  totalViews: z.number().optional(),
  isAnon: z.boolean().optional().default(false),
  anonymousMetadata: anonymousMetadataSchema.optional(),
  reactions: z.record(z.string(), postReactionSchema).optional(),
  communityId: z.string().uuid(),
  communityData: CommunitySchema.optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => !data.isAnon || (data.isAnon && data.anonymousMetadata),
  {
    message: "Anonymous posts must include anonymous metadata",
    path: ["anonymousMetadata"],
  }
)

export const createPostSchema = z.object({
  title: z.string().min(10, "A title is required to continue."),
  content: z.string().min(10, "A content is required to continue."),
  communityId: z.string().uuid(),
  isAnon: z.boolean().default(false),
  anonymousMetadata: anonymousMetadataSchema.optional(),
}).refine(
  (data) => !data.isAnon || (data.isAnon && data.anonymousMetadata),
  {
    message: "Anonymous posts must include anonymous metadata",
    path: ["anonymousMetadata"],
  }
)

export type Post = z.infer<typeof postSchema>
export type PostAuthor = z.infer<typeof postAuthorSchema>
export type PostReply = z.infer<typeof postReplySchema>
export type PostReaction = z.infer<typeof postReactionSchema>
export type CreatePost = z.infer<typeof createPostSchema>
export type AnonymousMetadata = z.infer<typeof anonymousMetadataSchema>
