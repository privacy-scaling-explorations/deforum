import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { 
  CommunitySchema, 
  CreateCommunityInput, 
  UpdateCommunityInput 
} from '@deforum/shared/schemas/community';
import { BadgeRequirements, CommunityMemberRole } from '../types/prisma';

export const communitiesRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    const communities = await ctx.prisma.community.findMany({
      where: {
        isPrivate: false,
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
        requiredBadges: {
          include: {
            badge: true,
          },
        },
      },
    });

    return communities;
  }),

  byId: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const community = await ctx.prisma.community.findUnique({
        where: { id: input },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          posts: {
            include: {
              author: true,
            },
          },
          requiredBadges: {
            include: {
              badge: true,
            },
          },
        },
      });

      if (!community) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Community not found',
        });
      }

      return community;
    }),

  create: protectedProcedure
    .input(CreateCommunityInput)
    .mutation(async ({ ctx, input }) => {
      const community = await ctx.prisma.community.create({
        data: {
          name: input.name,
          description: input.description,
          isPrivate: input.isPrivate,
          avatar: input.avatar,
          members: {
            create: {
              userId: ctx.user.id,
              role: CommunityMemberRole.ADMIN,
            },
          },
          requiredBadges: input.badgeRequirements ? {
            create: input.badgeRequirements.map(req => ({
              badgeId: req.badgeId,
              requirements: req.requirements as any,
            })),
          } : undefined,
        },
      });

      return community;
    }),

  update: protectedProcedure
    .input(UpdateCommunityInput)
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const membership = await ctx.prisma.communityMember.findFirst({
        where: {
          communityId: input.id,
          userId: ctx.user.id,
          role: 'ADMIN',
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only community admins can update community settings',
        });
      }

      const community = await ctx.prisma.community.update({
        where: { id: input.id },
        data: {
          name: input.data.name,
          description: input.data.description,
          isPrivate: input.data.isPrivate,
          avatar: input.data.avatar,
          requiredBadges: input.data.badgeRequirements ? {
            deleteMany: {},
            create: input.data.badgeRequirements.map(req => ({
              badgeId: req.badgeId,
              requirements: req.requirements as any,
            })),
          } : undefined,
        },
      });

      return community;
    }),

  join: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const community = await ctx.prisma.community.findUnique({
        where: { id: input },
        include: {
          requiredBadges: {
            include: {
              badge: true,
            },
          },
        },
      });

      if (!community) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Community not found',
        });
      }

      // Check if user has required badges
      if (community.requiredBadges.length > 0) {
        const userBadges = await ctx.prisma.userBadge.findMany({
          where: {
            userId: ctx.user.id,
          },
          include: {
            badge: true,
          },
        });

        for (const requirement of community.requiredBadges) {
          const requirements = requirement.requirements as BadgeRequirements;
          const hasBadge = userBadges.some(ub => 
            ub.badgeId === requirement.badgeId &&
            (!requirements?.domain || (ctx.user.email && ctx.user.email.endsWith(requirements.domain))) &&
            (!requirements?.exactEmail || ctx.user.email === requirements.exactEmail)
          );

          if (!hasBadge) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Missing required badge: ${requirement.badge.name}`,
            });
          }
        }
      }

      const membership = await ctx.prisma.communityMember.create({
        data: {
          userId: ctx.user.id,
          communityId: input,
          role: CommunityMemberRole.MEMBER,
        },
      });

      return membership;
    }),

  leave: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.prisma.communityMember.findFirst({
        where: {
          communityId: input,
          userId: ctx.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Not a member of this community',
        });
      }

      if (membership.role === CommunityMemberRole.ADMIN) {
        // Check if this is the last admin
        const adminCount = await ctx.prisma.communityMember.count({
          where: {
            communityId: input,
            role: CommunityMemberRole.ADMIN,
          },
        });

        if (adminCount === 1) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot leave community as last admin',
          });
        }
      }

      await ctx.prisma.communityMember.delete({
        where: {
          id: membership.id,
        },
      });

      return true;
    }),

  members: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const members = await ctx.prisma.communityMember.findMany({
        where: {
          communityId: input,
        },
        include: {
          user: true,
        },
      });

      return members;
    }),
}); 