import { initTRPC } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { prisma } from '@/lib/db';

interface CreateContextOptions {
  user?: {
    id: string;
  };
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    prisma,
    user: opts.user,
  };
};

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  // Get the session from your auth provider here
  const user = { id: 'test-user-id' }; // Replace with actual auth
  return createInnerTRPCContext({ user });
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Not authenticated');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
}); 