import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { verifyJWT, JWTPayload, extractTokenFromHeader } from './jwt';
import { PrismaClient } from '@prisma/client';
import { inferAsyncReturnType } from '@trpc/server';

const prisma = new PrismaClient();

export interface Context {
  req: CreateNextContextOptions['req'];
  res: CreateNextContextOptions['res'];
  user?: JWTPayload;
  prisma: PrismaClient;
}

export const createContext = async (opts: CreateNextContextOptions): Promise<Context> => {
  const token = extractTokenFromHeader(opts.req.headers.authorization);
  let user: JWTPayload | undefined;

  if (token) {
    try {
      user = await verifyJWT(token);
    } catch (error) {
      // Token verification failed, but we don't throw here
      // The auth middleware will handle unauthorized access
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    prisma,
    user
  };
};

export type ContextType = inferAsyncReturnType<typeof createContext>;
