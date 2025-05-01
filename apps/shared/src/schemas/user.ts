import { z } from "zod"
import { BadgeCredentialSchema } from "./badge"

export const UserPublicKeySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  publicKey: z.string(),
  isDeactivated: z.boolean().default(false),
  createdAt: z.string(),
  deactivatedAt: z.string().optional(),
});

export type UserPublicKey = z.infer<typeof UserPublicKeySchema>;

export const FollowSchema = z.object({
  id: z.string().uuid(),
  followerId: z.string().uuid(),
  followingId: z.string().uuid(),
  createdAt: z.string(),
});

export type Follow = z.infer<typeof FollowSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  publicKeys: z.array(UserPublicKeySchema).optional(),
  activePublicKey: UserPublicKeySchema.optional(),
  isAnon: z.boolean().default(false),
  website: z.string().optional(),
  communities: z.array(z.tuple([z.string(), z.string()])).optional(),
  // Following privacy settings
  showFollowers: z.boolean().default(true),
  showFollowing: z.boolean().default(false),
  // Following counts
  followersCount: z.number().optional(),
  followingCount: z.number().optional(),
  // Following status (for the current user)
  isFollowing: z.boolean().optional(),
  isFollowedBy: z.boolean().optional(),
  // Badge credentials
  badgeCredentials: z.array(BadgeCredentialSchema).optional(),
})

export type User = z.infer<typeof UserSchema>

// Input types
export const CreateUserInput = UserSchema.omit({ 
  id: true, 
  followersCount: true, 
  followingCount: true, 
  isFollowing: true, 
  isFollowedBy: true,
  badgeCredentials: true,
  publicKeys: true,
  activePublicKey: true
})

export const UpdateUserInput = z.object({
  id: z.string().uuid(),
  data: UserSchema.partial().omit({ id: true, publicKeys: true }),
})

export const AddPublicKeyInput = z.object({
  userId: z.string().uuid(),
  publicKey: z.string(),
});

export const DeactivatePublicKeyInput = z.object({
  userId: z.string().uuid(),
  keyId: z.string().uuid(),
});

export type CreateUserInput = z.infer<typeof CreateUserInput>
export type UpdateUserInput = z.infer<typeof UpdateUserInput>
export type AddPublicKeyInput = z.infer<typeof AddPublicKeyInput>
export type DeactivatePublicKeyInput = z.infer<typeof DeactivatePublicKeyInput>

// Input types for following operations
export const FollowUserInput = z.object({
  userId: z.string().uuid(),
});

export type FollowUserInput = z.infer<typeof FollowUserInput>;
