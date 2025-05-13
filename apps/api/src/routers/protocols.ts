import { z } from 'zod';
import { router, publicProcedure } from '../lib/trpc';
import { TRPCError } from '@trpc/server';

export const protocolsRouter = router({
  // Queries
  all: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.protocol.findMany({
      include: {
        badges: {
          include: {
            badgeDefinition: true
          }
        }
      }
    });
  }),

  byId: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const protocol = await ctx.prisma.protocol.findUnique({
      where: { id: input.id },
      include: {
        badges: {
          include: {
            badgeDefinition: true
          }
        }
      }
    });

    if (!protocol) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Protocol not found'
      });
    }

    return protocol;
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const protocol = await ctx.prisma.protocol.findUnique({
      where: { slug: input.slug },
      include: {
        badges: {
          include: {
            badgeDefinition: true
          }
        }
      }
    });

    if (!protocol) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Protocol not found'
      });
    }

    return protocol;
  }),

  // Get all badges
  badges: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.badgeDefinition.findMany({
      include: {
        protocols: {
          include: {
            protocol: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });
  }),

  // Get badges by type
  badgesByType: publicProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.badgeDefinition.findMany({
        where: {
          metadata: {
            path: ['type'],
            equals: input.type
          }
        },
        include: {
          protocols: {
            include: {
              protocol: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      });
    })
});
