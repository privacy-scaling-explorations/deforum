import { z } from 'zod';
import { CommunitySchema } from './community';
import { UserPublicKeySchema } from './user';

export const PostType = z.enum(['PROFILE', 'COMMUNITY']);
export type PostType = z.infer<typeof PostType>;

export const SemaphoreProofMetadataSchema = z.object({
  id: z.string().uuid(),
  proof: z.string(),
  nullifier: z.string(),
  publicSignals: z.array(z.string()),
  merkleRootId: z.string().uuid(),
  createdAt: z.string()
});

export type SemaphoreProofMetadata = z.infer<typeof SemaphoreProofMetadataSchema>;

export const ReactionSchema = z.object({
  id: z.string().uuid(),
  emoji: z.string(),
  proofMetadata: SemaphoreProofMetadataSchema.optional(),
  createdAt: z.string(),
  postId: z.string().uuid().optional(),
  replyId: z.string().uuid().optional()
});

export type Reaction = z.infer<typeof ReactionSchema>;

export const SignatureMetadataSchema = z.object({
  signature: z.string(),
  timestamp: z.number(),
  nonce: z.string()
});

export type SignatureMetadata = z.infer<typeof SignatureMetadataSchema>;

export const postAuthorSchema = z
  .object({
    id: z.string().uuid().nullable().optional(),
    username: z.string().nullable().optional(),
    isAnon: z.boolean().default(false),
    badges: z.array(z.string().uuid()).optional()
  })
  .refine((data) => (data?.isAnon ? data?.id === null : data?.id !== null), {
    message: 'Id must be null when isAnon is true.',
    path: ['id']
  });

export const postReplySchema = z.object({
  id: z.string().uuid(),
  content: z.string().optional(),
  author: postAuthorSchema,
  signedBy: UserPublicKeySchema.optional(),
  signatureMetadata: z.string().optional(),
  createdAt: z.string().optional(),
  postMention: z.string().uuid().optional().nullable().optional(),
  proofMetadata: SemaphoreProofMetadataSchema.optional(),
  reactions: z.array(ReactionSchema).optional()
});

export const postSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    type: PostType,
    replies: z.array(
      postReplySchema.and(
        z.object({
          replies: z.array(postReplySchema).optional()
        })
      )
    ),
    author: postAuthorSchema,
    signedBy: UserPublicKeySchema.optional(),
    signatureMetadata: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    totalViews: z.number().optional(),
    isAnon: z.boolean().optional().default(false),
    proofMetadata: SemaphoreProofMetadataSchema.optional(),
    reactions: z.array(ReactionSchema).optional(),
    communityId: z.string().uuid().optional().nullable().optional(),
    communityData: CommunitySchema.optional(),
    tags: z.array(z.string()).optional()
  })
  .refine((data) => !data.isAnon || (data.isAnon && data.proofMetadata), {
    message: 'Anonymous posts must include Semaphore proof metadata',
    path: ['proofMetadata']
  })
  .refine((data) => data.type !== 'COMMUNITY' || (data.type === 'COMMUNITY' && data.communityId), {
    message: 'Community posts must include a communityId',
    path: ['communityId']
  })
  .refine((data) => data.isAnon || (!data.isAnon && data.signatureMetadata), {
    message: 'Non-anonymous posts must be signed',
    path: ['signatureMetadata']
  });

export const createPostSchema = z
  .object({
    title: z.string().min(4, 'A title is required to continue.'),
    content: z.string().min(10, 'A content is required to continue.'),
    type: PostType,
    communityId: z.string().uuid().optional().nullable().optional(),
    isAnon: z.boolean().default(false),
    proofMetadata: SemaphoreProofMetadataSchema.optional(),
    signatureMetadata: z.string().optional()
  })
  .refine((data) => !data.isAnon || (data.isAnon && data.proofMetadata), {
    message: 'Anonymous posts must include Semaphore proof metadata',
    path: ['proofMetadata']
  })
  .refine((data) => data.type !== 'COMMUNITY' || (data.type === 'COMMUNITY' && data.communityId), {
    message: 'Community posts must include a communityId',
    path: ['communityId']
  })
  .refine((data) => data.isAnon || (!data.isAnon && data.signatureMetadata), {
    message: 'Non-anonymous posts must be signed',
    path: ['signatureMetadata']
  });

export const createReactionSchema = z.object({
  postId: z.string().uuid(),
  emoji: z.string(),
  add: z.boolean(),
  proofMetadata: SemaphoreProofMetadataSchema
});

export type CreateReactionInput = z.infer<typeof createReactionSchema>;

export type Post = z.infer<typeof postSchema>;
export type PostAuthor = z.infer<typeof postAuthorSchema>;
export type PostReply = z.infer<typeof postReplySchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type CreateReaction = z.infer<typeof createReactionSchema>;
