import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { createPostSchema, anonymousMetadataSchema } from '@deforum/shared/schemas/post';

const ReplySchema = z.object({
  content: z.string().min(1),
  replyParentId: z.string().uuid().optional(),
  isAnon: z.boolean().default(false),
  anonymousMetadata: anonymousMetadataSchema.optional(),
}).refine(
  (data) => !data.isAnon || (data.isAnon && data.anonymousMetadata),
  {
    message: "Anonymous replies must include anonymous metadata",
    path: ["anonymousMetadata"],
  }
);

type ReplyInput = z.infer<typeof ReplySchema>;

const CreateReplyInput = z.object({
  postId: z.string().uuid(),
  data: ReplySchema,
});

const UpdateReplyInput = z.object({
  id: z.string().uuid(),
  data: ReplySchema,
});

type CreateReplyInputType = z.infer<typeof CreateReplyInput>;
type UpdateReplyInputType = z.infer<typeof UpdateReplyInput>;

const ReactionsSchema = z.record(z.string(), z.object({
  count: z.number(),
  nullifiers: z.array(z.string()),
}));

export const postsRouter = router({
  all: publicProcedure
    .input(z.object({
      communityId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.post.findMany({
        take: input.limit + 1,
        where: {
          communityId: input.communityId,
        },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          author: {
            include: {
              userBadges: {
                include: {
                  badge: true,
                },
              },
            },
          },
          community: true,
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      // Transform the response to include badge IDs
      const transformedItems = items.map(post => ({
        ...post,
        author: {
          ...post.author,
          badges: post.author.userBadges.map(ub => ub.badge.id),
        },
      }));

      return {
        items: transformedItems,
        nextCursor,
      };
    }),

  byId: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
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
                  author: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
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

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user is member of community
      const membership = await ctx.prisma.communityMember.findFirst({
        where: {
          communityId: input.communityId,
          userId: ctx.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Must be a member of the community to post',
        });
      }

      const post = await ctx.prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.user.id,
          communityId: input.communityId,
          isAnon: input.isAnon || false,
          anonymousMetadata: input.anonymousMetadata ? input.anonymousMetadata : undefined,
        },
      });

      return post;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: createPostSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      if (post.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this post',
        });
      }

      const updatedPost = await ctx.prisma.post.update({
        where: { id: input.id },
        data: {
          title: input.data.title,
          content: input.data.content,
          isAnon: input.data.isAnon || false,
          anonymousMetadata: input.data.anonymousMetadata ? input.data.anonymousMetadata : undefined,
        },
      });

      return updatedPost;
    }),

  delete: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      if (post.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this post',
        });
      }

      await ctx.prisma.post.delete({
        where: { id: input },
      });

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
          authorId: input.data.isAnon ? undefined : ctx.user.id,
          replyParentId: input.data.replyParentId,
          isAnon: input.data.isAnon,
          anonymousMetadata: input.data.anonymousMetadata,
        },
        include: {
          author: true,
          replyParent: true
        }
      });
    }),

  updateReply: protectedProcedure
    .input(UpdateReplyInput)
    .mutation(async ({ ctx, input }: { ctx: any; input: UpdateReplyInputType }) => {
      const reply = await ctx.prisma.postReply.findUnique({
        where: { id: input.id },
        select: { authorId: true }
      });

      if (!reply) {
        throw new Error('Reply not found');
      }

      if (reply.authorId !== ctx.user.id) {
        throw new Error('Not authorized to update this reply');
      }

      return ctx.prisma.postReply.update({
        where: { id: input.id },
        data: {
          content: input.data.content,
          replyParentId: input.data.replyParentId,
          isAnon: input.data.isAnon,
          anonymousMetadata: input.data.anonymousMetadata,
        },
        include: {
          author: true,
          replyParent: true
        }
      });
    }),

  deleteReply: protectedProcedure
    .input(z.object({ replyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const reply = await ctx.prisma.postReply.findUnique({
        where: { id: input.replyId },
        select: { authorId: true }
      });

      if (!reply) {
        throw new Error('Reply not found');
      }

      if (reply.authorId !== ctx.user.id) {
        throw new Error('Not authorized to delete this reply');
      }

      await ctx.prisma.postReply.delete({
        where: { id: input.replyId }
      });

      return { success: true };
    }),

  // Reactions
  updateReactions: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      emoji: z.string(),
      nullifier: z.string(),
      add: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
        select: { reactions: true }
      });

      if (!post) {
        throw new Error('Post not found');
      }

      const reactions = post.reactions as Record<string, { count: number, nullifiers: string[] }>;
      const reaction = reactions[input.emoji] || { count: 0, nullifiers: [] };

      if (input.add) {
        if (!reaction.nullifiers.includes(input.nullifier)) {
          reaction.count++;
          reaction.nullifiers.push(input.nullifier);
        }
      } else {
        const index = reaction.nullifiers.indexOf(input.nullifier);
        if (index !== -1) {
          reaction.count--;
          reaction.nullifiers.splice(index, 1);
        }
      }

      reactions[input.emoji] = reaction;

      return ctx.prisma.post.update({
        where: { id: input.postId },
        data: {
          reactions
        }
      });
    }),
}); 