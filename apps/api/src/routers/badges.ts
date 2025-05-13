import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../lib/trpc';
import { TRPCError } from '@trpc/server';
import {
  CreateBadgeDefinitionInput,
  UpdateBadgeDefinitionInput,
  IssueBadgeCredentialInput,
  RevokeBadgeCredentialInput
} from '@deforum/shared/schemas/badge';
import { verifier as dummyVerifier } from '../badges/dummy-badge/dummy-protocol';

const BadgeDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3),
  slug: z.string(),
  description: z.string().optional(),
  protocolId: z.string().uuid(),
  metadata: z.record(z.string(), z.any()).optional(),
  privateByDefault: z.boolean().default(true),
  expiresAfter: z.number().int().min(1).optional()
});

const CreateBadgeDefinitionSchema = BadgeDefinitionSchema.omit({ id: true });

const UpdateBadgeInputSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    name: z.string().min(3).optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    protocolId: z.string().uuid().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    privateByDefault: z.boolean().optional(),
    expiresAfter: z.number().int().min(1).optional()
  })
});

type UpdateBadgeInputType = z.infer<typeof UpdateBadgeInputSchema>;

export const badgesRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.badgeDefinition.findMany({
      include: {
        protocols: {
          include: {
            protocol: true
          }
        },
        _count: {
          select: {
            issuances: true
          }
        }
      }
    });
  }),

  byId: publicProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const badge = await ctx.prisma.badgeDefinition.findUnique({
      where: { id: input },
      include: {
        protocols: {
          include: {
            protocol: true
          }
        },
        issuances: {
          include: {
            user: true
          }
        }
      }
    });

    if (!badge) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Badge not found'
      });
    }

    return badge;
  }),

  bySlug: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const badge = await ctx.prisma.badgeDefinition.findUnique({
      where: { slug: input },
      include: {
        protocols: {
          include: {
            protocol: true
          }
        },
        _count: {
          select: {
            issuances: true
          }
        }
      }
    });

    if (!badge) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Badge not found'
      });
    }

    return badge;
  }),

  byProtocol: publicProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return ctx.prisma.badgeDefinition.findMany({
      where: {
        protocols: {
          some: {
            protocolId: input
          }
        }
      },
      include: {
        protocols: {
          include: {
            protocol: true
          }
        },
        _count: {
          select: {
            issuances: true
          }
        }
      }
    });
  }),

  // Badge Management
  create: protectedProcedure.input(CreateBadgeDefinitionInput).mutation(async ({ ctx, input }) => {
    const badge = await ctx.prisma.badgeDefinition.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        metadata: input.metadata,
        privateByDefault: input.privateByDefault,
        expiresAfter: input.expiresAfter,
        protocols: {
          create: input.protocolIds.map((protocolId) => ({
            protocol: { connect: { id: protocolId } },
            metadata: input.protocolMetadata
          }))
        }
      },
      include: {
        protocols: {
          include: {
            protocol: true
          }
        }
      }
    });

    return badge;
  }),

  update: protectedProcedure.input(UpdateBadgeDefinitionInput).mutation(async ({ ctx, input }) => {
    const badge = await ctx.prisma.badgeDefinition.update({
      where: { id: input.id },
      data: {
        name: input.data.name,
        slug: input.data.slug,
        description: input.data.description,
        metadata: input.data.metadata,
        privateByDefault: input.data.privateByDefault,
        expiresAfter: input.data.expiresAfter,
        protocols: {
          deleteMany: {},
          create: input.data.protocolIds.map((protocolId) => ({
            protocol: { connect: { id: protocolId } },
            metadata: input.data.protocolMetadata
          }))
        }
      },
      include: {
        protocols: {
          include: {
            protocol: true
          }
        }
      }
    });

    return badge;
  }),

  // Badge Usage Stats
  stats: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [totalUsers, activeUsers, communities] = await Promise.all([
        ctx.prisma.badgeCredential.count({
          where: { badgeId: input.id }
        }),
        ctx.prisma.badgeCredential.count({
          where: {
            badgeId: input.id,
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
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
        communities: communities.map((c) => ({
          ...c.community,
          memberCount: c.community._count.members
        }))
      };
    }),

  // Issue Badge to User
  issue: protectedProcedure.input(IssueBadgeCredentialInput).mutation(async ({ ctx, input }) => {
    const badgeDefinition = await ctx.prisma.badgeDefinition.findUnique({
      where: { id: input.badgeId }
    });

    const credential = await ctx.prisma.badgeCredential.create({
      data: {
        user: { connect: { id: input.userId } },
        definition: { connect: { id: input.badgeId } },
        isPublic: input.isPublic,
        metadata: input.metadata,
        verifiedAt: new Date(),
        expiresAt: badgeDefinition?.expiresAfter
          ? new Date(Date.now() + badgeDefinition.expiresAfter * 24 * 60 * 60 * 1000)
          : null
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
      }
    });

    return credential;
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

  revoke: protectedProcedure.input(RevokeBadgeCredentialInput).mutation(async ({ ctx, input }) => {
    return ctx.prisma.badgeCredential.update({
      where: { id: input.id },
      data: {
        revokedAt: new Date()
      }
    });
  }),

  verifyAndIssue: protectedProcedure
    .input(
      z.object({
        badgeSlug: z.string(),
        protocolSlug: z.string(),
        proofData: z.any()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get badge definition
      const badgeDefinition = await ctx.prisma.badgeDefinition.findUnique({
        where: { slug: input.badgeSlug },
        include: {
          protocols: {
            include: {
              protocol: true
            }
          }
        }
      });

      if (!badgeDefinition) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Badge definition not found'
        });
      }

      // Find the protocol
      const protocolBadge = badgeDefinition.protocols.find(
        (pb) => pb.protocol.slug === input.protocolSlug
      );

      if (!protocolBadge) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Protocol not associated with this badge'
        });
      }

      // Verify the proof based on badge and protocol
      let isVerified = false;
      if (input.badgeSlug === 'dummy-badge' && input.protocolSlug === 'dummy-protocol') {
        isVerified = dummyVerifier(input.proofData);
      }

      if (!isVerified) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid proof'
        });
      }

      // Create the badge credential
      const credential = await ctx.prisma.badgeCredential.create({
        data: {
          userId: ctx.user.userId,
          badgeId: badgeDefinition.id,
          isPublic: !badgeDefinition.privateByDefault,
          metadata: input.proofData,
          verifiedAt: new Date(),
          expiresAt: badgeDefinition.expiresAfter
            ? new Date(Date.now() + badgeDefinition.expiresAfter * 24 * 60 * 60 * 1000)
            : null
        },
        include: {
          definition: true
        }
      });

      return credential;
    })
});
