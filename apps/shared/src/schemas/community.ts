import { z } from "zod";

export const CommunityBadgeRequirementSchema = z.object({
  id: z.string().uuid(),
  badgeId: z.string().uuid(),
  communityId: z.string().uuid(),
  requirements: z.object({
    domain: z.string().optional(),
    exactEmail: z.string().email().optional(),
  }),
});

export const CommunitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
});

// Inferred types
export type Community = z.infer<typeof CommunitySchema>;
export type CommunityBadgeRequirement = z.infer<typeof CommunityBadgeRequirementSchema>;

// Input types
export const CreateCommunityInput = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  isPrivate: z.boolean().default(false),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  badgeRequirements: z.array(z.object({
    badgeId: z.string().uuid(),
    requirements: CommunityBadgeRequirementSchema.shape.requirements,
  })).optional(),
});

export const UpdateCommunityInput = z.object({
  id: z.string().uuid(),
  data: CreateCommunityInput,
});

export type CreateCommunityInput = z.infer<typeof CreateCommunityInput>;
export type UpdateCommunityInput = z.infer<typeof UpdateCommunityInput>;