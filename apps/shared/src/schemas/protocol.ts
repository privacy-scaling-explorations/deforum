import { z } from 'zod';

export const ProtocolSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export type Protocol = z.infer<typeof ProtocolSchema>;

// Input types
export const CreateProtocolInput = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const UpdateProtocolInput = z.object({
  id: z.string().uuid(),
  data: CreateProtocolInput
});

export type CreateProtocolInput = z.infer<typeof CreateProtocolInput>;
export type UpdateProtocolInput = z.infer<typeof UpdateProtocolInput>;
