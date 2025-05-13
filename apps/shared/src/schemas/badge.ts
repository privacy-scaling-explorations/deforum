import { z } from 'zod';
import { ProtocolSchema } from './protocol';

// Protocol-Badge relationship schema
export const ProtocolBadgeDefinitionSchema = z.object({
  id: z.string().uuid(),
  protocolId: z.string().uuid(),
  protocol: ProtocolSchema,
  badgeDefinitionId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string()
});

export const BadgeDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  protocols: z.array(ProtocolBadgeDefinitionSchema).optional(),
  metadata: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.any()), z.record(z.any())])
    .nullable()
    .optional(),
  privateByDefault: z.boolean().default(true),
  expiresAfter: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  issuances: z.array(z.any()).optional() // BadgeCredential[]
});

export type BadgeDefinition = z.infer<typeof BadgeDefinitionSchema>;
export type ProtocolBadgeDefinition = z.infer<typeof ProtocolBadgeDefinitionSchema>;

// Badge Credential (issued badge) schema
export const BadgeCredentialSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  badgeId: z.string().uuid(),
  definition: BadgeDefinitionSchema,
  isPublic: z.boolean(),
  metadata: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.any()), z.record(z.any())])
    .nullable()
    .optional(),
  createdAt: z.string(),
  verifiedAt: z.string(),
  expiresAt: z.string().optional(),
  revokedAt: z.string().optional()
});

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
  metadata: z.record(z.any()).optional()
});

export const RevokeBadgeCredentialInput = z.object({
  id: z.string().uuid()
});

export type CreateBadgeDefinitionInput = z.infer<typeof CreateBadgeDefinitionInput>;
export type UpdateBadgeDefinitionInput = z.infer<typeof UpdateBadgeDefinitionInput>;
export type IssueBadgeCredentialInput = z.infer<typeof IssueBadgeCredentialInput>;
export type RevokeBadgeCredentialInput = z.infer<typeof RevokeBadgeCredentialInput>;
