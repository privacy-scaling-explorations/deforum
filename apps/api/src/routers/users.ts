import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { UpdateUserInput } from '@deforum/shared/schemas/user';

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        posts: {
          include: {
            author: true,
          },
        },
        _count: {
          select: {
            posts: true,
            replies: true,
            userBadges: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  byId: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          posts: {
            include: {
              author: true,
            },
          },
          _count: {
            select: {
              posts: true,
              replies: true,
              userBadges: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  update: protectedProcedure
    .input(UpdateUserInput)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          username: input.data.username,
          email: input.data.email,
          avatar: input.data.avatar,
          website: input.data.website,
          bio: input.data.bio,
          publicKey: input.data.publicKey ? [input.data.publicKey] : undefined,
        },
      });

      return user;
    }),

  stats: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          _count: {
            select: {
              posts: true,
              replies: true,
              userBadges: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        totalPosts: user._count.posts,
        totalReplies: user._count.replies,
        totalBadges: user._count.userBadges,
      };
    }),

  badges: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          userBadges: {
            include: {
              badge: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user.userBadges;
    }),
}); 