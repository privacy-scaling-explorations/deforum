import { z } from "zod"

export const CommunityMerkleRootSchema = z.object({
  id: z.string().uuid(),
  communityId: z.string().uuid(),
  merkleRoot: z.string(),
  createdAt: z.string(),
})

export type CommunityMerkleRoot = z.infer<typeof CommunityMerkleRootSchema>

export const MerkleTreeSchema = z.object({
  root: z.string(),
  tree: z.array(z.string()),
  indices: z.record(z.string(), z.number()), // Map of public key to leaf index
})

export type MerkleTree = z.infer<typeof MerkleTreeSchema>

export const GetMerkleTreeInput = z.object({
  communityId: z.string().uuid(),
})

export const GetRecentMerkleRootsInput = z.object({
  communityId: z.string().uuid(),
})

export type GetMerkleTreeInput = z.infer<typeof GetMerkleTreeInput>
export type GetRecentMerkleRootsInput = z.infer<typeof GetRecentMerkleRootsInput> 