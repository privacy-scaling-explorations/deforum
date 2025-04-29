import { z } from "zod";

export const BadgeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3),
  slug: z.string(),
  description: z.string().optional(),
  protocolId: z.string().uuid(),
  metadata: z.record(z.string(), z.any()).optional(),
  privateByDefault: z.boolean().default(true),
  expiresAfter: z.number().int().min(1).optional(),
});

export type Badge = z.infer<typeof BadgeSchema>;

// Input types
export const CreateBadgeSchema = z.object({
  name: z.string().min(3),
  slug: z.string(),
  description: z.string().optional(),
  protocolId: z.string().uuid(),
  metadata: z.record(z.string(), z.any()).optional(),
  privateByDefault: z.boolean().default(true),
  expiresAfter: z.number().int().min(1).optional(),
});

export const UpdateBadgeInput = z.object({
  id: z.string().uuid(),
  data: CreateBadgeSchema,
});

export type CreateBadgeInput = z.infer<typeof CreateBadgeSchema>;
export type UpdateBadgeInput = z.infer<typeof UpdateBadgeInput>;