import { initTRPC } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Not authenticated');
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed); 