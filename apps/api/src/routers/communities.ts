import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../lib/trpc';
import { TRPCError } from '@trpc/server';
import { Group } from '@semaphore-protocol/group';
import {
  CommunitySchema,
  CreateCommunityInput,
  UpdateCommunityInput
} from '@deforum/shared/schemas/community';
import { BadgeRequirements, CommunityMemberRole } from '../types/prisma';
import {
  GetMerkleTreeInput,
  GetRecentMerkleRootsInput,
  MerkleTreeSchema
} from '@deforum/shared/schemas/merkleRoot';
import { generateSlug } from '@deforum/shared/utils/slug';

// Helper function to serialize group state
function serializeGroup(group: Group): string {
  return JSON.stringify({
    members: group.members,
    root: group.root.toString()
  });
}

// Helper function to deserialize group state
function deserializeGroup(state: string): Group {
  const { members, root } = JSON.parse(state);
  const group = new Group(members);
  return group;
}

export const communitiesRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    const communities = await ctx.prisma.community.findMany({
      where: {
        isPrivate: false
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true
          }
        },
        requiredBadges: {
          include: {
            badge: true
          }
        }
      }
    });

    return communities;
  }),

  byId: publicProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const community = await ctx.prisma.community.findUnique({
      where: { id: input },
      include: {
        members: {
          include: {
            user: true
          }
        },
        posts: {
          include: {
            author: true
          }
        },
        requiredBadges: {
          include: {
            badge: true
          }
        }
      }
    });

    if (!community) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Community not found'
      });
    }

    return community;
  }),

  bySlug: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const community = await ctx.prisma.community.findUnique({
      where: { slug: input },
      include: {
        members: {
          include: {
            user: true
          }
        },
        posts: {
          include: {
            author: true
          }
        },
        requiredBadges: {
          include: {
            badge: true
          }
        }
      }
    });

    if (!community) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Community not found'
      });
    }

    return community;
  }),

  // create: protectedProcedure.input(CreateCommunityInput).mutation(async ({ ctx, input }) => {
  //   // Generate initial slug from name
  //   let slug = generateSlug(input.name);

  //   // Check if slug exists and append number if needed
  //   let slugExists = true;
  //   let counter = 1;
  //   let finalSlug = slug;

  //   while (slugExists) {
  //     const existing = await ctx.prisma.community.findUnique({
  //       where: { slug: finalSlug }
  //     });

  //     if (!existing) {
  //       slugExists = false;
  //     } else {
  //       finalSlug = `${slug}-${counter}`;
  //       counter++;
  //     }
  //   }

  //   const community = await ctx.prisma.community.create({
  //     data: {
  //       name: input.name,
  //       description: input.description,
  //       isPrivate: input.isPrivate,
  //       avatar: input.avatar,
  //       slug: finalSlug,
  //       members: {
  //         create: {
  //           userId: ctx.user.userId,
  //           role: CommunityMemberRole.ADMIN
  //         }
  //       },
  //       requiredBadges: input.requiredBadges
  //         ? {
  //             create: input.requiredBadges.map((req) => ({
  //               badgeId: req.badgeId,
  //               requirements: req.requirements as any
  //             }))
  //           }
  //         : undefined
  //     }
  //   });

  //   return community;
  // }),

  // update: protectedProcedure.input(UpdateCommunityInput).mutation(async ({ ctx, input }) => {
  //   // Check if user is admin
  //   const membership = await ctx.prisma.communityMember.findFirst({
  //     where: {
  //       communityId: input.id,
  //       userId: ctx.user.userId,
  //       role: 'ADMIN'
  //     }
  //   });

  //   if (!membership) {
  //     throw new TRPCError({
  //       code: 'FORBIDDEN',
  //       message: 'Only community admins can update community settings'
  //     });
  //   }

  //   // Generate new slug if name changed
  //   let newSlug: string | undefined = undefined;
  //   if (input.data.name) {
  //     let slug = generateSlug(input.data.name);
  //     let slugExists = true;
  //     let counter = 1;
  //     let finalSlug = slug;

  //     while (slugExists) {
  //       const existing = await ctx.prisma.community.findUnique({
  //         where: {
  //           slug: finalSlug,
  //           NOT: { id: input.id }
  //         }
  //       });

  //       if (!existing) {
  //         slugExists = false;
  //       } else {
  //         finalSlug = `${slug}-${counter}`;
  //         counter++;
  //       }
  //     }
  //     newSlug = finalSlug;
  //   }

  //   const community = await ctx.prisma.community.update({
  //     where: { id: input.id },
  //     data: {
  //       name: input.data.name,
  //       description: input.data.description,
  //       isPrivate: input.data.isPrivate,
  //       avatar: input.data.avatar,
  //       ...(newSlug ? { slug: newSlug } : {}),
  //       requiredBadges: input.data.requiredBadges
  //         ? {
  //             deleteMany: {},
  //             create: input.data.requiredBadges.map((req) => ({
  //               badgeId: req.badgeId,
  //               requirements: req.requirements as any
  //             }))
  //           }
  //         : undefined
  //     }
  //   });

  //   return community;
  // }),

  join: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const community = await ctx.prisma.community.findUnique({
      where: { id: input },
      include: {
        requiredBadges: {
          include: {
            badge: true
          }
        }
      }
    });

    if (!community) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Community not found'
      });
    }

    // Check if user is already a member
    const existingMembership = await ctx.prisma.communityMember.findFirst({
      where: {
        communityId: input,
        userId: ctx.user.userId
      }
    });

    if (existingMembership) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Already a member of this community'
      });
    }

    // Check if user has required badges
    if (community.requiredBadges.length > 0) {
      const userBadgeCredentials = await ctx.prisma.badgeCredential.findMany({
        where: {
          userId: ctx.user.userId,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        },
        include: {
          definition: true
        }
      });

      for (const requirement of community.requiredBadges) {
        const requirements = requirement.requirements as BadgeRequirements;
        const hasBadge = userBadgeCredentials.some(
          (bc) =>
            requirement.badgeId === bc.definition.id &&
            (!bc.expiresAt || bc.expiresAt > new Date()) &&
            !bc.revokedAt
        );

        if (!hasBadge) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Missing required badge: ${requirement.badge.name}`
          });
        }
      }
    }

    const membership = await ctx.prisma.communityMember.create({
      data: {
        userId: ctx.user.userId,
        communityId: input,
        role: CommunityMemberRole.MEMBER
      }
    });

    return membership;
  }),

  leave: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const membership = await ctx.prisma.communityMember.findFirst({
      where: {
        communityId: input,
        userId: ctx.user.userId
      }
    });

    if (!membership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Not a member of this community'
      });
    }

    if (membership.role === CommunityMemberRole.ADMIN) {
      // Check if this is the last admin
      const adminCount = await ctx.prisma.communityMember.count({
        where: {
          communityId: input,
          role: CommunityMemberRole.ADMIN
        }
      });

      if (adminCount === 1) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot leave community as last admin'
        });
      }
    }

    await ctx.prisma.communityMember.delete({
      where: {
        id: membership.id
      }
    });

    return true;
  }),

  members: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const members = await ctx.prisma.communityMember.findMany({
      where: {
        communityId: input
      },
      include: {
        user: true
      }
    });

    return members;
  }),

  getMerkleTree: publicProcedure.input(GetMerkleTreeInput).query(async ({ ctx, input }) => {
    // Get community members and their public keys
    const members = await ctx.prisma.communityMember.findMany({
      where: { communityId: input.communityId },
      include: {
        user: {
          include: {
            publicKeys: {
              where: { isDeactivated: false },
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      },
      orderBy: {
        user: {
          createdAt: 'asc'
        }
      }
    });

    // Extract active public keys in order
    const publicKeys = members
      .flatMap((member) => member.user.publicKeys)
      .map((key) => key.publicKey);

    // Generate merkle tree
    const group = new Group(publicKeys);

    // Store new merkle root
    await ctx.prisma.communityMerkleRoot.create({
      data: {
        communityId: input.communityId,
        merkleRoot: serializeGroup(group)
      }
    });

    return group;
  }),

  getRecentMerkleRoots: publicProcedure
    .input(GetRecentMerkleRootsInput)
    .query(async ({ ctx, input }) => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const roots = await ctx.prisma.communityMerkleRoot.findMany({
        where: {
          communityId: input.communityId,
          createdAt: {
            gte: fiveMinutesAgo
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return roots.map((root) => ({
        ...root,
        group: deserializeGroup(root.merkleRoot)
      }));
    }),

  getMostRecentMerkleRoot: publicProcedure
    .input(z.string().uuid()) // communityId
    .query(async ({ ctx, input }) => {
      const root = await ctx.prisma.communityMerkleRoot.findFirst({
        where: {
          communityId: input
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!root) {
        // Get community members and their public keys
        const members = await ctx.prisma.communityMember.findMany({
          where: { communityId: input },
          include: {
            user: {
              include: {
                publicKeys: {
                  where: { isDeactivated: false },
                  orderBy: { createdAt: 'asc' }
                }
              }
            }
          },
          orderBy: {
            user: {
              createdAt: 'asc'
            }
          }
        });

        // Extract active public keys in order
        const publicKeys = members
          .flatMap((member) => member.user.publicKeys)
          .map((key) => key.publicKey);

        // Generate merkle tree
        const group = new Group(publicKeys);

        // Store new merkle root
        const newRoot = await ctx.prisma.communityMerkleRoot.create({
          data: {
            communityId: input,
            merkleRoot: serializeGroup(group)
          }
        });

        return {
          ...newRoot,
          group
        };
      }

      return {
        ...root,
        group: deserializeGroup(root.merkleRoot)
      };
    }),

  // Helper middleware to update merkle root when membership changes
  $updateMerkleRoot: protectedProcedure
    .input(z.string().uuid()) // communityId
    .mutation(async ({ ctx, input }) => {
      // Similar to getMerkleTree but without returning the tree
      const members = await ctx.prisma.communityMember.findMany({
        where: { communityId: input },
        include: {
          user: {
            include: {
              publicKeys: {
                where: { isDeactivated: false },
                orderBy: { createdAt: 'asc' }
              }
            }
          }
        },
        orderBy: {
          user: {
            createdAt: 'asc'
          }
        }
      });

      const publicKeys = members
        .flatMap((member) => member.user.publicKeys)
        .map((key) => key.publicKey);

      const group = new Group(publicKeys);

      return ctx.prisma.communityMerkleRoot.create({
        data: {
          communityId: input,
          merkleRoot: serializeGroup(group)
        }
      });
    }),

  byUser: publicProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return ctx.prisma.communityMember.findMany({
      where: { userId: input },
      include: {
        community: true
      }
    });
  })
});
