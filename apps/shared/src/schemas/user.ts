import { z } from "zod"

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  publicKey: z.string().optional(),
  isAnon: z.boolean().default(false),
  website: z.string().optional(),
})

export type User = z.infer<typeof UserSchema>

// Input types
export const CreateUserInput = UserSchema.omit({ id: true })
export const UpdateUserInput = z.object({
  id: z.string().uuid(),
  data: UserSchema.partial().omit({ id: true }),
})

export type CreateUserInput = z.infer<typeof CreateUserInput>
export type UpdateUserInput = z.infer<typeof UpdateUserInput>
