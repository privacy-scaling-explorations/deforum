import { z } from 'zod';
import { BadgeDefinitionSchema } from './badge';

export const CommunityRequiredBadgeSchema = z.object({
  id: z.string().uuid(),
  communityId: z.string().uuid(),
  badgeId: z.string().uuid(),
  badge: BadgeDefinitionSchema,
  requirements: z.record(z.any()).nullable().optional(),
  createdAt: z.string()
});

export const CommunityMemberSchema = z.object({
  id: z.string().uuid(),
  communityId: z.string().uuid(),
  userId: z.string().uuid(),
  joinedAt: z.string(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER')
});

export const CommunitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  isPrivate: z.boolean().default(false),
  requiredBadges: z.array(CommunityRequiredBadgeSchema).optional(),
  _count: z
    .object({
      posts: z.number(),
      members: z.number()
    })
    .optional()
});

// Inferred types
export type Community = z.infer<typeof CommunitySchema>;
export type CommunityRequiredBadge = z.infer<typeof CommunityRequiredBadgeSchema>;
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;

// Input types
export const CreateCommunityInput = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500).optional(),
  isPrivate: z.boolean().default(false),
  avatar: z.string().optional(),
  requiredBadges: z
    .array(
      z.object({
        badgeId: z.string().uuid(),
        requirements: z.record(z.any()).optional()
      })
    )
    .optional()
});

export const UpdateCommunityInput = z.object({
  id: z.string().uuid(),
  data: CreateCommunityInput
});

export type CreateCommunityInput = z.infer<typeof CreateCommunityInput>;
export type UpdateCommunityInput = z.infer<typeof UpdateCommunityInput>;
