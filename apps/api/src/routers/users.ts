import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../lib/trpc';
import { TRPCError } from '@trpc/server';
import {
  UpdateUserInput,
  AddPublicKeyInput,
  DeactivatePublicKeyInput
} from '@deforum/shared/schemas/user';
import { prisma } from '../lib/db';
import sharp from 'sharp';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { trpcLogger } from '../lib/logger';
import { stringify } from 'querystring';

const FollowUserInput = z.object({
  userId: z.string().uuid()
});

const AVATAR_MAX_SIZE = 1024 * 1024; // 1MB
const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const COMPRESSED_SIZE = 1024; // Max dimension in pixels

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error(`Context doesn't contain user ${ctx}`);
    }
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.userId },
      include: {
        posts: {
          include: {
            author: true
          }
        },
        communities: {
          include: {
            community: true
          }
        },
        credentials: {
          include: {
            definition: true
          }
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
            followers: true
          }
        }
      }
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    return {
      ...user,
      communities: user.communities.map((cm) => [
        cm.community.id,
        cm.community.name,
        cm.community.slug,
        cm.community.avatar
      ]),
      badges: user.credentials.map((c) => c.definition),
      followersCount: user._count.followers,
      followingCount: user._count.following,
      activePublicKey: user.publicKeys[0] // Most recently created active key
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
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
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
              followers: true
            }
          }
        }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
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
                followerId: ctx.user.userId,
                followingId: user.id
              }
            }
          }),
          ctx.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: user.id,
                followingId: ctx.user.userId
              }
            }
          })
        ]);

        isFollowing = !!followingCheck;
        isFollowedBy = !!followerCheck;

        // Check if user can view followers/following based on privacy settings
        canViewFollowers = user.showFollowers || ctx.user.userId === user.id;
        canViewFollowing = user.showFollowing || ctx.user.userId === user.id;
      }

      return {
        ...user,
        badges: user.credentials.map((c) => c.definition),
        followersCount: canViewFollowers ? user._count.followers : null,
        followingCount: canViewFollowing ? user._count.following : null,
        isFollowing,
        isFollowedBy,
        canViewFollowers,
        canViewFollowing,
        activePublicKey: user.publicKeys[0] // Most recently created active key
      };
    }),

  byId: publicProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input },
      include: {
        posts: {
          include: {
            author: true
          }
        },
        credentials: {
          include: {
            definition: true
          }
        },
        _count: {
          select: {
            posts: true,
            replies: true,
            credentials: true
          }
        }
      }
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    return user;
  }),

  updateProfile: protectedProcedure.input(UpdateUserInput).mutation(async ({ ctx, input }) => {
    // Check if username is taken (case insensitive)
    if (!ctx.user) {
      throw new Error(`Context doesn't contain user ${ctx}`);
    }
    if (input.username && input.username !== ctx.user.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: input.username,
            mode: 'insensitive'
          }
        }
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already taken'
        });
      }
    }

    // Update user profile
    return prisma.user.update({
      where: { id: ctx.user.userId },
      data: {
        ...(input.username && { username: input.username }),
        ...(input.website !== undefined && { website: input.website }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.showFollowers !== undefined && { showFollowers: input.showFollowers }),
        ...(input.showFollowing !== undefined && { showFollowing: input.showFollowing })
      },
      include: {
        publicKeys: {
          where: {
            isDeactivated: false
          }
        }
      }
    });
  }),

  stats: publicProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input },
      include: {
        _count: {
          select: {
            posts: true,
            replies: true,
            credentials: true
          }
        }
      }
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    return {
      totalPosts: user._count.posts,
      totalReplies: user._count.replies,
      totalBadges: user._count.credentials
    };
  }),

  badges: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const credentials = await ctx.prisma.badgeCredential.findMany({
      where: {
        userId: input,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      include: {
        definition: {
          include: {
            protocols: {
              include: {
                protocol: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return credentials;
  }),

  // Following-related endpoints
  follow: protectedProcedure.input(FollowUserInput).mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error(`Context doesn't contain user ${ctx}`);
    }
    if (ctx.user.userId === input.userId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot follow yourself'
      });
    }

    // Check if target user exists
    const targetUser = await ctx.prisma.user.findUnique({
      where: { id: input.userId }
    });

    if (!targetUser) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // Create follow relationship
    if (!ctx.user) {
      throw new Error(`Context doesn't contain user ${ctx}`);
    }
    const follow = await ctx.prisma.follow.create({
      data: {
        followerId: ctx.user.userId,
        followingId: input.userId
      }
    });

    return follow;
  }),

  unfollow: protectedProcedure.input(FollowUserInput).mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error(`Context doesn't contain user ${ctx}`);
    }
    await ctx.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: ctx.user.userId,
          followingId: input.userId
        }
      }
    });

    return true;
  }),

  followers: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(10)
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if followers list is public
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { showFollowers: true }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      // Only allow viewing followers if:
      // 1. The list is public, or
      // 2. The viewer is the user themselves
      if (!user.showFollowers && (!ctx.user || ctx.user.userId !== input.userId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Followers list is private'
        });
      }

      const followers = await ctx.prisma.follow.findMany({
        take: input.limit + 1,
        where: { followingId: input.userId },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: true
        }
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (followers.length > input.limit) {
        const nextItem = followers.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: followers.map((f) => f.follower),
        nextCursor
      };
    }),

  following: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(10)
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if following list is public
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { showFollowing: true }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      // Only allow viewing following if:
      // 1. The list is public, or
      // 2. The viewer is the user themselves
      if (!user.showFollowing && (!ctx.user || ctx.user.userId !== input.userId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Following list is private'
        });
      }

      const following = await ctx.prisma.follow.findMany({
        take: input.limit + 1,
        where: { followerId: input.userId },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          following: true
        }
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (following.length > input.limit) {
        const nextItem = following.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: following.map((f) => f.following),
        nextCursor
      };
    }),

  // Public key management
  addPublicKey: protectedProcedure.input(AddPublicKeyInput).mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error(`Context doesn't contain user ${ctx}`);
    }
    return ctx.prisma.userPublicKey.create({
      data: {
        userId: ctx.user.userId,
        publicKey: input.publicKey
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
          message: 'Public key not found'
        });
      }

      if (key.userId !== ctx.user?.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to deactivate this key'
        });
      }

      return ctx.prisma.userPublicKey.update({
        where: { id: input.keyId },
        data: {
          isDeactivated: true,
          deactivatedAt: new Date()
        }
      });
    }),

  uploadAvatar: protectedProcedure
    .input(
      z.object({
        file: z.instanceof(File)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const file = input.file;
      if (!file) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No file provided'
        });
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only JPEG and PNG images are allowed'
        });
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File size must be less than 5MB'
        });
      }

      // Compress image if needed
      let processedBuffer = Buffer.from(await file.arrayBuffer());
      if (processedBuffer.length > AVATAR_MAX_SIZE) {
        processedBuffer = await sharp(processedBuffer)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .png()
          .toBuffer();
      }
      if (!ctx.user) {
        throw new Error(`Context doesn't contain user ${ctx}`);
      }
      // Save to server
      const filename = `${ctx.user.userId}${path.extname(file.name)}`;
      const filepath = path.join(process.cwd(), 'uploads', 'avatars', filename);
      await writeFile(filepath, processedBuffer);

      // Update user's avatar
      const avatar = `/uploads/avatars/${filename}`;
      await prisma.user.update({
        where: { id: ctx.user?.userId },
        data: { avatar }
      });

      return { avatar };
    }),

  removeAvatar: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error(`Context doesn't contain user ${ctx}`);
    }
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.userId },
      select: { avatar: true }
    });

    if (user?.avatar) {
      // Remove avatar file
      const filepath = path.join(process.cwd(), user.avatar);
      await unlink(filepath).catch(() => {}); // Ignore if file doesn't exist

      // Remove avatar URL from user
      await prisma.user.update({
        where: { id: ctx.user?.userId },
        data: { avatar: null }
      });
    }

    return { success: true };
  }),

  getPasskeys: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error(`Context doesn't contain user ${ctx}`);
    }
    const passkeys = await prisma.passkey.findMany({
      where: {
        userId: ctx.user.userId
      },
      select: {
        id: true,
        credentialId: true,
        lastUsedAt: true,
        createdAt: true
      }
    });
    return passkeys;
  }),

  removePasskey: protectedProcedure
    .input(z.object({ passkeyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error(`Context doesn't contain user ${ctx}`);
      }
      const passkey = await prisma.passkey.findFirst({
        where: {
          id: input.passkeyId,
          userId: ctx.user.userId
        }
      });

      if (!passkey) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Passkey not found'
        });
      }

      await prisma.passkey.delete({
        where: { id: input.passkeyId }
      });

      return { success: true };
    })
});
