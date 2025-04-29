import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const protocolsRouter = router({
  // Queries
  all: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.protocol.findMany({
        include: {
          badges: true
        }
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const protocol = await ctx.prisma.protocol.findUnique({
        where: { id: input.id },
        include: {
          badges: true
        }
      });

      if (!protocol) {
        throw new Error('Protocol not found');
      }

      return protocol;
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const protocol = await ctx.prisma.protocol.findUnique({
        where: { slug: input.slug },
        include: {
          badges: true
        }
      });

      if (!protocol) {
        throw new Error('Protocol not found');
      }

      return protocol;
    }),

  // Get all protocol attributes
  attributes: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.badge.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          metadata: true,
          protocol: {
            select: {
              name: true,
              slug: true
            }
          }
        }
      });
    }),

  // Get protocol attributes by type
  attributesByType: publicProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.badge.findMany({
        where: {
          metadata: {
            path: ['type'],
            equals: input.type
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          metadata: true,
          protocol: {
            select: {
              name: true,
              slug: true
            }
          }
        }
      });
    }),
}); 