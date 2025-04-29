import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from './lib/prisma';
import type { User } from '../../shared/src/schemas/user';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // TODO: Implement signature verification & get user from database
  let user: User | null = null;

  if (!user) {
    // TODO: This is a temporary solution to get a user for testing
    user = await prisma.user.findUnique({
      where: {
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    }) as User | null;
  }

  return {
    req,
    res,
    prisma,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>; 