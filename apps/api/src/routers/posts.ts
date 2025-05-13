import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../lib/trpc';
import { TRPCError } from '@trpc/server';
import {
  PostType,
  createPostSchema,
  createReactionSchema,
  SemaphoreProofMetadataSchema
} from '@deforum/shared/schemas/post';
import { PrismaClient } from '@prisma/client';

const ReplySchema = z
  .object({
    content: z.string().min(1),
    replyParentId: z.string().uuid().optional(),
    isAnon: z.boolean().default(false),
    proofMetadata: SemaphoreProofMetadataSchema.optional(),
    signatureMetadata: z.string().optional()
  })
  .refine((data) => !data.isAnon || (data.isAnon && data.proofMetadata), {
    message: 'Anonymous replies must include Semaphore proof metadata',
    path: ['proofMetadata']
  })
  .refine((data) => data.isAnon || (!data.isAnon && data.signatureMetadata), {
    message: 'Non-anonymous replies must be signed',
    path: ['signatureMetadata']
  });

type ReplyInput = z.infer<typeof ReplySchema>;

const SignatureMetadataSchema = z.object({
  signature: z.string(),
  timestamp: z.number(),
  nonce: z.string()
});

type CreateReplyInputType = {
  postId: string;
  data: {
    content: string;
    replyParentId?: string;
    isAnon: boolean;
    proofMetadata?: z.infer<typeof SemaphoreProofMetadataSchema>;
    signatureMetadata?: string;
  };
};

const CreateReplyInput = z.object({
  postId: z.string().uuid(),
  data: z
    .object({
      content: z.string().min(1),
      replyParentId: z.string().uuid().optional(),
      isAnon: z.boolean().default(false),
      proofMetadata: SemaphoreProofMetadataSchema.optional(),
      signatureMetadata: z.string().optional()
    })
    .refine((data) => !data.isAnon || (data.isAnon && data.proofMetadata), {
      message: 'Anonymous replies must include Semaphore proof metadata',
      path: ['proofMetadata']
    })
    .refine((data) => data.isAnon || (!data.isAnon && data.signatureMetadata), {
      message: 'Non-anonymous replies must be signed',
      path: ['signatureMetadata']
    })
});

type UpdateReplyInputType = {
  id: string;
  data: {
    content: string;
    replyParentId?: string;
    isAnon: boolean;
    proofMetadata?: z.infer<typeof SemaphoreProofMetadataSchema>;
    signatureMetadata?: string;
  };
};

const UpdateReplyInput = z.object({
  id: z.string().uuid(),
  data: z
    .object({
      content: z.string().min(1),
      replyParentId: z.string().uuid().optional(),
      isAnon: z.boolean().default(false),
      proofMetadata: SemaphoreProofMetadataSchema.optional(),
      signatureMetadata: z.string().optional()
    })
    .refine((data) => !data.isAnon || (data.isAnon && data.proofMetadata), {
      message: 'Anonymous replies must include Semaphore proof metadata',
      path: ['proofMetadata']
    })
    .refine((data) => data.isAnon || (!data.isAnon && data.signatureMetadata), {
      message: 'Non-anonymous replies must be signed',
      path: ['signatureMetadata']
    })
});

const ReactionsSchema = z.record(
  z.string(),
  z.object({
    count: z.number(),
    nullifiers: z.array(z.string())
  })
);

// Helper function to verify merkle root is recent
async function verifyMerkleRoot(prisma: PrismaClient, communityId: string, merkleRoot: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const root = await prisma.communityMerkleRoot.findFirst({
    where: {
      communityId,
      merkleRoot,
      createdAt: {
        gte: fiveMinutesAgo
      }
    }
  });

  if (!root) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid or expired merkle root'
    });
  }

  return root;
}

export const postsRouter = router({
  all: publicProcedure
    .input(
      z.object({
        communityId: z.string().uuid().optional(),
        authorId: z.string().uuid().optional(),
        postType: z.enum(['PROFILE', 'COMMUNITY']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(10)
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.post.findMany({
        take: input.limit + 1,
        where: {
          communityId: input.communityId,
          authorId: input.authorId,
          postType: input.postType as PostType | undefined
        },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          author: {
            include: {
              credentials: {
                include: {
                  definition: true
                }
              }
            }
          },
          community: true,
          proofMetadata: true,
          _count: {
            select: {
              replies: true
            }
          }
        }
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: items.map((post) => ({
          ...post,
          authorDetails: post.author
            ? {
                ...post.author,
                badges: post.author.credentials.map((c) => c.definition.id)
              }
            : null
        })),
        nextCursor
      };
    }),

  profilePosts: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(10)
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.post.findMany({
        take: input.limit + 1,
        where: {
          authorId: input.userId,
          postType: 'PROFILE'
        },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          author: {
            include: {
              credentials: {
                include: {
                  definition: true
                }
              }
            }
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: items.map((post) => ({
          ...post,
          author: {
            ...post.author,
            badges: post.author.credentials.map((c) => c.definition.id)
          }
        })),
        nextCursor
      };
    }),

  byId: publicProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const post = await ctx.prisma.post.findUnique({
      where: { id: input },
      include: {
        author: true,
        community: true,
        replies: {
          include: {
            author: true,
            childReplies: {
              include: {
                author: true
              }
            }
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      });
    }

    return post;
  }),

  byCommunity: publicProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.post.findMany({
        where: {
          communityId: input.communityId
        },
        include: {
          author: true,
          _count: {
            select: { replies: true }
          }
        }
      });
    }),

  byAuthor: publicProcedure
    .input(z.object({ authorId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.post.findMany({
        where: {
          authorId: input.authorId
        },
        include: {
          community: true,
          _count: {
            select: { replies: true }
          }
        }
      });
    }),

  create: protectedProcedure.input(createPostSchema).mutation(async ({ ctx, input }) => {
    // Check community membership if this is a community post
    if (input.communityId) {
      const membership = await ctx.prisma.communityMember.findFirst({
        where: {
          communityId: input.communityId,
          userId: ctx.user.userId
        }
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member of the community to post'
        });
      }
    } else {
      // TODO post to user profile
    }

    // If anonymous post, verify merkle root
    let merkleRootId: string | undefined;
    if (input.isAnon && input.proofMetadata) {
      if (!input.communityId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Anonymous posts must be in a community'
        });
      }

      // Extract merkle root from public signals
      const merkleRoot = input.proofMetadata.publicSignals[0];
      const root = await verifyMerkleRoot(ctx.prisma, input.communityId, merkleRoot);
      merkleRootId = root.id;
    }

    // Create post with proof metadata if anonymous
    return ctx.prisma.post.create({
      data: {
        title: input.title,
        content: input.content,
        author: { connect: { id: ctx.user.userId } },
        ...(input.communityId && { community: { connect: { id: input.communityId } } }),
        postType: input.communityId ? 'COMMUNITY' : 'PROFILE',
        isAnon: input.isAnon,
        ...(input.signatureMetadata && {
          signatureMetadata: input.signatureMetadata
        }),
        ...(input.proofMetadata && {
          proofMetadata: {
            create: {
              proof: input.proofMetadata.proof,
              nullifier: input.proofMetadata.nullifier,
              publicSignals: input.proofMetadata.publicSignals,
              merkleRoot: { connect: { id: merkleRootId! } }
            }
          }
        })
      },
      include: {
        author: true,
        community: true,
        proofMetadata: true
      }
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: createPostSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: { proofMetadata: true }
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found'
        });
      }

      if (post.authorId !== ctx.user.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this post'
        });
      }

      // Update post and related proof metadata
      let merkleRootId: string | undefined;
      if (input.data.isAnon && input.data.proofMetadata) {
        if (!post.communityId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Anonymous posts must be in a community'
          });
        }

        // Extract merkle root from public signals
        const merkleRoot = input.data.proofMetadata.publicSignals[0];
        const root = await verifyMerkleRoot(ctx.prisma, post.communityId, merkleRoot);
        merkleRootId = root.id;
      }

      return ctx.prisma.post.update({
        where: { id: input.id },
        data: {
          title: input.data.title,
          content: input.data.content,
          isAnon: input.data.isAnon,
          signatureMetadata: input.data.signatureMetadata,
          proofMetadata: input.data.proofMetadata
            ? {
                upsert: {
                  create: {
                    proof: input.data.proofMetadata.proof,
                    nullifier: input.data.proofMetadata.nullifier,
                    publicSignals: input.data.proofMetadata.publicSignals,
                    merkleRoot: { connect: { id: merkleRootId! } }
                  },
                  update: {
                    proof: input.data.proofMetadata.proof,
                    nullifier: input.data.proofMetadata.nullifier,
                    publicSignals: input.data.proofMetadata.publicSignals,
                    merkleRoot: { connect: { id: merkleRootId! } }
                  }
                }
              }
            : undefined
        },
        include: {
          proofMetadata: true,
          author: true,
          community: true
        }
      });
    }),

  delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    const post = await ctx.prisma.post.findUnique({
      where: { id: input },
      include: { proofMetadata: true }
    });

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found'
      });
    }

    if (post.authorId !== ctx.user.userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to delete this post'
      });
    }

    // Delete post and associated proof metadata
    await ctx.prisma.$transaction([
      ctx.prisma.semaphoreProofMetadata.deleteMany({
        where: { postId: input }
      }),
      ctx.prisma.post.delete({
        where: { id: input }
      })
    ]);

    return true;
  }),

  // Reply mutations
  createReply: protectedProcedure
    .input(CreateReplyInput)
    .mutation(async ({ ctx, input }: { ctx: any; input: CreateReplyInputType }) => {
      return ctx.prisma.postReply.create({
        data: {
          content: input.data.content,
          postId: input.postId,
          authorId: input.data.isAnon ? undefined : ctx.user.userId,
          replyParentId: input.data.replyParentId,
          isAnon: input.data.isAnon,
          signatureMetadata: input.data.signatureMetadata,
          ...(input.data.proofMetadata && {
            proofMetadata: {
              create: {
                proof: input.data.proofMetadata.proof,
                nullifier: input.data.proofMetadata.nullifier,
                publicSignals: input.data.proofMetadata.publicSignals
              }
            }
          })
        },
        include: {
          author: true,
          replyParent: true,
          proofMetadata: true
        }
      });
    }),

  updateReply: protectedProcedure
    .input(UpdateReplyInput)
    .mutation(async ({ ctx, input }: { ctx: any; input: UpdateReplyInputType }) => {
      const reply = await ctx.prisma.postReply.findUnique({
        where: { id: input.id },
        include: { proofMetadata: true }
      });

      if (!reply) {
        throw new Error('Reply not found');
      }

      if (reply.authorId !== ctx.user.userId) {
        throw new Error('Not authorized to update this reply');
      }

      return ctx.prisma.postReply.update({
        where: { id: input.id },
        data: {
          content: input.data.content,
          replyParentId: input.data.replyParentId,
          isAnon: input.data.isAnon,
          signatureMetadata: input.data.signatureMetadata,
          proofMetadata: input.data.proofMetadata
            ? {
                upsert: {
                  create: {
                    proof: input.data.proofMetadata.proof,
                    nullifier: input.data.proofMetadata.nullifier,
                    publicSignals: input.data.proofMetadata.publicSignals
                  },
                  update: {
                    proof: input.data.proofMetadata.proof,
                    nullifier: input.data.proofMetadata.nullifier,
                    publicSignals: input.data.proofMetadata.publicSignals
                  }
                }
              }
            : undefined
        },
        include: {
          author: true,
          replyParent: true,
          proofMetadata: true
        }
      });
    }),

  deleteReply: protectedProcedure
    .input(z.object({ replyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const reply = await ctx.prisma.postReply.findUnique({
        where: { id: input.replyId },
        include: { proofMetadata: true }
      });

      if (!reply) {
        throw new Error('Reply not found');
      }

      if (reply.authorId !== ctx.user.userId) {
        throw new Error('Not authorized to delete this reply');
      }

      // Delete reply and associated proof metadata
      await ctx.prisma.$transaction([
        ctx.prisma.semaphoreProofMetadata.deleteMany({
          where: { replyId: input.replyId }
        }),
        ctx.prisma.postReply.delete({
          where: { id: input.replyId }
        })
      ]);

      return { success: true };
    }),

  // Reactions
  updateReactions: protectedProcedure
    .input(createReactionSchema)
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
        include: {
          reactions: {
            include: { proofMetadata: true }
          },
          community: true
        }
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found'
        });
      }

      // Verify merkle root for anonymous reactions
      let merkleRootId: string | undefined;
      if (post.community && input.proofMetadata) {
        const merkleRoot = input.proofMetadata.publicSignals[0];
        const root = await verifyMerkleRoot(ctx.prisma, post.community.id, merkleRoot);
        merkleRootId = root.id;
      }

      if (input.add) {
        // Add new reaction with proof metadata
        await ctx.prisma.reaction.create({
          data: {
            emoji: input.emoji,
            post: { connect: { id: input.postId } },
            proofMetadata: {
              create: {
                proof: input.proofMetadata.proof,
                nullifier: input.proofMetadata.nullifier,
                publicSignals: input.proofMetadata.publicSignals,
                merkleRoot: { connect: { id: merkleRootId! } }
              }
            }
          }
        });
      } else {
        // Find and remove reaction by proof metadata nullifier
        const existingReaction = post.reactions.find(
          (r) => r.proofMetadata?.nullifier === input.proofMetadata.nullifier
        );

        if (existingReaction) {
          await ctx.prisma.$transaction([
            ctx.prisma.semaphoreProofMetadata.delete({
              where: { id: existingReaction.proofMetadata!.id }
            }),
            ctx.prisma.reaction.delete({
              where: { id: existingReaction.id }
            })
          ]);
        }
      }

      return ctx.prisma.post.findUnique({
        where: { id: input.postId },
        include: {
          reactions: {
            include: {
              proofMetadata: true
            }
          }
        }
      });
    })
});
