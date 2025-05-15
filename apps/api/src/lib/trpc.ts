import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import { trpcLogger } from './logger';

export const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error }) => {
    // Log all errors
    trpcLogger.error(
      `Error: ${error.message}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        code: shape.code,
        data: shape.data,
        message: shape.message
      }
    );

    return shape;
  }
});

// Logging middleware to log all requests
export const loggingMiddleware = t.middleware(async ({ path, type, next, ctx, input }) => {
  const start = Date.now();
  const userId = ctx.user?.userId;
  const logContext = {
    path,
    type,
    userId,
    input: process.env.NODE_ENV === 'development' ? input : undefined
  };

  trpcLogger.info(`${type} request to ${path}`, logContext);

  try {
    const result = await next();
    const durationMs = Date.now() - start;

    trpcLogger.debug(`${type} request to ${path} completed in ${durationMs}ms`, {
      ...logContext,
      durationMs
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - start;

    trpcLogger.error(
      `${type} request to ${path} failed after ${durationMs}ms`,
      error instanceof Error ? error : new Error(String(error)),
      {
        ...logContext,
        durationMs
      }
    );

    throw error;
  }
});

// Auth middleware
export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated'
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);
export const protectedProcedure = t.procedure.use(loggingMiddleware).use(authMiddleware);
