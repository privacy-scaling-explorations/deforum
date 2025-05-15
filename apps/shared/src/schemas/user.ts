import { z } from 'zod';
import { BadgeCredentialSchema } from './badge';
import { PasskeySchema } from './auth';
import { CommunityMemberSchema } from './community';

export type Passkey = z.infer<typeof PasskeySchema>;

export const UserPublicKeySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  publicKey: z.string(),
  isDeactivated: z.boolean().default(false),
  createdAt: z.string(),
  deactivatedAt: z.string().optional()
});

export type UserPublicKey = z.infer<typeof UserPublicKeySchema>;

export const FollowSchema = z.object({
  id: z.string().uuid(),
  followerId: z.string().uuid(),
  followingId: z.string().uuid(),
  createdAt: z.string()
});

export type Follow = z.infer<typeof FollowSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3),
  avatar: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  language: z.string().optional(),
  isAnon: z.boolean().default(false),
  showFollowers: z.boolean().default(true),
  showFollowing: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
  credentials: z.array(BadgeCredentialSchema).optional(),
  communities: z.array(CommunityMemberSchema).optional(),
  publicKeys: z.array(UserPublicKeySchema).optional(),
  passkeys: z.array(PasskeySchema).optional(),
  _count: z
    .object({
      followers: z.number(),
      following: z.number()
    })
    .optional()
});

export type User = z.infer<typeof UserSchema>;

// Input types
export const CreateUserInput = UserSchema.omit({
  id: true,
  _count: true,
  credentials: true,
  communities: true,
  publicKeys: true,
  passkeys: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateUserInput = z.object({
  username: z.string().min(3).optional(),
  website: z.string().optional(),
  bio: z.string().optional(),
  showFollowers: z.boolean().optional(),
  showFollowing: z.boolean().optional()
});

export const AddPublicKeyInput = z.object({
  userId: z.string().uuid(),
  publicKey: z.string()
});

export const DeactivatePublicKeyInput = z.object({
  userId: z.string().uuid(),
  keyId: z.string().uuid()
});

export type CreateUserInput = z.infer<typeof CreateUserInput>;
export type UpdateUserInput = z.infer<typeof UpdateUserInput>;
export type AddPublicKeyInput = z.infer<typeof AddPublicKeyInput>;
export type DeactivatePublicKeyInput = z.infer<typeof DeactivatePublicKeyInput>;

// Input types for following operations
export const FollowUserInput = z.object({
  userId: z.string().uuid()
});

export type FollowUserInput = z.infer<typeof FollowUserInput>;
