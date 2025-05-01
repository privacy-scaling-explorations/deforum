import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { 
  UpdateUserInput, 
  AddPublicKeyInput, 
  DeactivatePublicKeyInput 
} from '@deforum/shared/schemas/user';

const FollowUserInput = z.object({
  userId: z.string().uuid(),
});

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
        communities: {
          include: {
            community: true
          }
        },
        credentials: {
          include: {
            definition: true,
          },
        },
        publicKeys: {
          where: {
            isDeactivated: false
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        following: true,
        followers: true,
        _count: {
          select: {
            posts: true,
            replies: true,
            credentials: true,
            following: true,
            followers: true,
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
      ...user,
      communities: user.communities.map(cm => [cm.community.id, cm.community.name, cm.community.slug]),
      badges: user.credentials.map(c => c.definition),
      followersCount: user._count.followers,
      followingCount: user._count.following,
      activePublicKey: user.publicKeys[0], // Most recently created active key
    };
  }),

  byUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { username: input.username },
        include: {
          credentials: {
            where: {
              isPublic: true,
              revokedAt: null,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            },
            include: {
              definition: true
            }
          },
          communities: {
            include: {
              community: true
            }
          },
          publicKeys: {
            where: {
              isDeactivated: false
            }
          },
          following: true,
          followers: true,
          _count: {
            select: {
              posts: true,
              replies: true,
              credentials: true,
              following: true,
              followers: true,
            }
          }
        }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // If authenticated, check if current user is following/followed by this user
      let isFollowing = false;
      let isFollowedBy = false;
      let canViewFollowers = false;
      let canViewFollowing = false;
      
      if (ctx.user) {
        const [followingCheck, followerCheck] = await Promise.all([
          ctx.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: ctx.user.id,
                followingId: user.id,
              },
            },
          }),
          ctx.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: user.id,
                followingId: ctx.user.id,
              },
            },
          }),
        ]);
        
        isFollowing = !!followingCheck;
        isFollowedBy = !!followerCheck;

        // Check if user can view followers/following based on privacy settings
        canViewFollowers = user.showFollowers || ctx.user.id === user.id;
        canViewFollowing = user.showFollowing || ctx.user.id === user.id;
      }

      return {
        ...user,
        badges: user.credentials.map(c => c.definition),
        followersCount: canViewFollowers ? user._count.followers : null,
        followingCount: canViewFollowing ? user._count.following : null,
        isFollowing,
        isFollowedBy,
        canViewFollowers,
        canViewFollowing,
        activePublicKey: user.publicKeys[0], // Most recently created active key
      };
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
          credentials: {
            include: {
              definition: true,
            },
          },
          _count: {
            select: {
              posts: true,
              replies: true,
              credentials: true,
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
      const updateData = {
        ...(input.data.username !== undefined && { username: input.data.username }),
        ...(input.data.email !== undefined && { email: input.data.email }),
        ...(input.data.avatar !== undefined && { avatar: input.data.avatar }),
        ...(input.data.website !== undefined && { website: input.data.website }),
        ...(input.data.bio !== undefined && { bio: input.data.bio }),
      };

      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: updateData,
        include: {
          publicKeys: {
            where: {
              isDeactivated: false
            }
          }
        }
      });
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
              credentials: true,
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
        totalBadges: user._count.credentials,
      };
    }),

  badges: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          credentials: {
            include: {
              definition: true,
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

      return user.credentials;
    }),

  // Following-related endpoints
  follow: protectedProcedure
    .input(FollowUserInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot follow yourself',
        });
      }

      // Check if target user exists
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Create follow relationship
      const follow = await ctx.prisma.follow.create({
        data: {
          followerId: ctx.user.id,
          followingId: input.userId,
        },
      });

      return follow;
    }),

  unfollow: protectedProcedure
    .input(FollowUserInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: ctx.user.id,
            followingId: input.userId,
          },
        },
      });

      return true;
    }),

  followers: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      // Check if followers list is public
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { showFollowers: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Only allow viewing followers if:
      // 1. The list is public, or
      // 2. The viewer is the user themselves
      if (!user.showFollowers && (!ctx.user || ctx.user.id !== input.userId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Followers list is private',
        });
      }

      const followers = await ctx.prisma.follow.findMany({
        take: input.limit + 1,
        where: { followingId: input.userId },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: true,
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (followers.length > input.limit) {
        const nextItem = followers.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: followers.map(f => f.follower),
        nextCursor,
      };
    }),

  following: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      // Check if following list is public
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { showFollowing: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Only allow viewing following if:
      // 1. The list is public, or
      // 2. The viewer is the user themselves
      if (!user.showFollowing && (!ctx.user || ctx.user.id !== input.userId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Following list is private',
        });
      }

      const following = await ctx.prisma.follow.findMany({
        take: input.limit + 1,
        where: { followerId: input.userId },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          following: true,
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (following.length > input.limit) {
        const nextItem = following.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: following.map(f => f.following),
        nextCursor,
      };
    }),

  // Update user settings including follow privacy
  updateSettings: protectedProcedure
    .input(z.object({
      showFollowers: z.boolean().optional(),
      showFollowing: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          showFollowers: input.showFollowers,
          showFollowing: input.showFollowing,
        },
      });
    }),

  // Public key management
  addPublicKey: protectedProcedure
    .input(AddPublicKeyInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userPublicKey.create({
        data: {
          userId: ctx.user.id,
          publicKey: input.publicKey,
        }
      });
    }),

  deactivatePublicKey: protectedProcedure
    .input(DeactivatePublicKeyInput)
    .mutation(async ({ ctx, input }) => {
      const key = await ctx.prisma.userPublicKey.findUnique({
        where: { id: input.keyId }
      });

      if (!key) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Public key not found',
        });
      }

      if (key.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to deactivate this key',
        });
      }

      return ctx.prisma.userPublicKey.update({
        where: { id: input.keyId },
        data: {
          isDeactivated: true,
          deactivatedAt: new Date(),
        }
      });
    }),
}); 