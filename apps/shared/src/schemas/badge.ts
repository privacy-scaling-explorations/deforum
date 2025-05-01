import { z } from "zod";
import { ProtocolSchema } from "./protocol";

// Protocol-Badge relationship schema
export const ProtocolBadgeSchema = z.object({
  id: z.string().uuid(),
  protocol: ProtocolSchema,
  metadata: z.record(z.any()).optional(),
  createdAt: z.string()
});

export const BadgeDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  protocols: z.array(ProtocolBadgeSchema),
  metadata: z.record(z.any()).optional(),
  privateByDefault: z.boolean().default(true),
  expiresAfter: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional()
});

export type BadgeDefinition = z.infer<typeof BadgeDefinitionSchema>;
export type ProtocolBadge = z.infer<typeof ProtocolBadgeSchema>;
export type BadgeCredential = z.infer<typeof BadgeCredentialSchema>;

// Input types
export const CreateBadgeDefinitionInput = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  protocolIds: z.array(z.string().uuid()),
  metadata: z.record(z.any()).optional(),
  protocolMetadata: z.record(z.any()).optional(),
  privateByDefault: z.boolean().default(true),
  expiresAfter: z.number().optional()
});

export const UpdateBadgeDefinitionInput = z.object({
  id: z.string().uuid(),
  data: CreateBadgeDefinitionInput
});

export const IssueBadgeCredentialInput = z.object({
  userId: z.string().uuid(),
  badgeId: z.string().uuid(),
  isPublic: z.boolean(),
  metadata: z.record(z.any()).optional(),
  expiresAfter: z.number().optional()
});

export const RevokeBadgeCredentialInput = z.object({
  id: z.string().uuid()
});

// Badge Credential (issued badge) schema
export const BadgeCredentialSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  badgeId: z.string().uuid(),
  isPublic: z.boolean(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  verifiedAt: z.string(),
  expiresAt: z.string().optional(),
  revokedAt: z.string().optional(),
  definition: BadgeDefinitionSchema
});