import { z } from 'zod';
import {
  BadgeSchema,
  CreateBadgeSchema,
  CreateBadgeInput,
  UpdateBadgeInput,
} from '@deforum/shared/schemas/badge';
import { router, publicProcedure, protectedProcedure } from '../trpc';

const UpdateBadgeInputSchema = z.object({
  id: z.string().uuid(),
  data: BadgeSchema.partial().omit({ id: true }),
});

type UpdateBadgeInputType = z.infer<typeof UpdateBadgeInputSchema>;

export const badgesRouter = router({
  all: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.badge.findMany({
        include: {
          protocol: true,
          _count: {
            select: {
              userBadges: true,
              requiredFor: true
            }
          }
        }
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const badge = await ctx.prisma.badge.findUnique({
        where: { id: input.id },
        include: {
          protocol: true,
          _count: {
            select: {
              userBadges: true,
              requiredFor: true
            }
          }
        }
      });

      if (!badge) {
        throw new Error('Badge not found');
      }

      return badge;
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const badge = await ctx.prisma.badge.findUnique({
        where: { slug: input.slug },
        include: {
          protocol: true,
          _count: {
            select: {
              userBadges: true,
              requiredFor: true
            }
          }
        }
      });

      if (!badge) {
        throw new Error('Badge not found');
      }

      return badge;
    }),

  byProtocol: publicProcedure
    .input(z.object({ protocolId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.badge.findMany({
        where: { protocolId: input.protocolId },
        include: {
          _count: {
            select: {
              userBadges: true,
              requiredFor: true
            }
          }
        }
      });
    }),

  // Badge Management
  create: protectedProcedure
    .input(CreateBadgeSchema)
    .mutation(async ({ ctx, input }) => {
      // TODO: Add permission check for badge creation
      return ctx.prisma.badge.create({
        data: input,
        include: {
          protocol: true
        }
      });
    }),

  update: protectedProcedure
    .input(UpdateBadgeInputSchema)
    .mutation(async ({ ctx, input }: { ctx: any; input: UpdateBadgeInputType }) => {
      // TODO: Add permission check for badge updates
      return ctx.prisma.badge.update({
        where: { id: input.id },
        data: {
          name: input.data.name,
          slug: input.data.slug,
          description: input.data.description,
          protocolId: input.data.protocolId,
          metadata: input.data.metadata,
          privateByDefault: input.data.privateByDefault,
          expiresAfter: input.data.expiresAfter,
        },
        include: {
          protocol: true
        }
      });
    }),

  // Badge Usage Stats
  stats: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [
        totalUsers,
        activeUsers,
        communities
      ] = await Promise.all([
        ctx.prisma.userBadge.count({
          where: { badgeId: input.id }
        }),
        ctx.prisma.userBadge.count({
          where: {
            badgeId: input.id,
            revokedAt: null,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }),
        ctx.prisma.communityRequiredBadge.findMany({
          where: { badgeId: input.id },
          include: {
            community: {
              select: {
                id: true,
                name: true,
                avatar: true,
                _count: {
                  select: { members: true }
                }
              }
            }
          }
        })
      ]);

      return {
        totalUsers,
        activeUsers,
        communities: communities.map(c => ({
          ...c.community,
          memberCount: c.community._count.members
        }))
      };
    }),

  // Issue Badge to User
  issueBadge: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
      badgeId: z.string().uuid(),
      metadata: z.record(z.string(), z.any()).optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Add permission check for badge issuance
      
      // Get the badge to check its privateByDefault setting and expiration
      const badge = await ctx.prisma.badge.findUnique({
        where: { id: input.badgeId }
      });

      if (!badge) {
        throw new Error('Badge not found');
      }

      // Calculate expiration date if badge has expiresAfter set
      const expiresAt = input.expiresAt || (badge.expiresAfter 
        ? new Date(Date.now() + badge.expiresAfter * 24 * 60 * 60 * 1000) 
        : null);

      // Create the user badge using the badge's privateByDefault setting
      return ctx.prisma.userBadge.create({
        data: {
          userId: input.userId,
          badgeId: input.badgeId,
          isPublic: !badge.privateByDefault,
          metadata: input.metadata,
          verifiedAt: new Date(),
          expiresAt,
        },
        include: {
          badge: true,
          user: true
        }
      });
    }),

  // Badge Requirements
  requirements: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.communityRequiredBadge.findMany({
        where: {
          badgeId: input.id,
          requirements: {
            path: ['isPublic'],
            equals: true
          }
        },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isPrivate: true
            }
          }
        }
      });
    }),
}); 