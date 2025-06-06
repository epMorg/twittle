import { z } from "zod";
import {
  type createTRPCContext,
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { type inferAsyncReturnType, TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { trimUserInfoForClient } from "~/server/helpers/trimUserInfoForClient";
import type { Post } from "@prisma/client";

type Context = inferAsyncReturnType<typeof createTRPCContext>;

const getLikedPostIdsForUser = async (
  userId: string,
  postIds: string[],
  ctx: Context
) => {
  const likedPostsByUser = await ctx.prisma.likedPost.findMany({
    where: {
      userId,
      postId: {
        in: postIds,
      },
    },
    select: {
      postId: true,
    },
  });

  return likedPostsByUser.map((post) => post.postId);
};

const getLikedCountForPosts = async (postIds: string[], ctx: Context) => {
  const likedCountsForPosts = await ctx.prisma.likedPost.groupBy({
    by: ["postId"],
    where: {
      postId: {
        in: postIds,
      },
    },
    _count: true,
  });
  return new Map(
    likedCountsForPosts.map((item) => {
      return [item.postId, item._count];
    })
  );
};

const addUserDataToPosts = async (
  posts: Post[],
  likedPostIdsByUser: string[],
  ctx: Context
) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(trimUserInfoForClient);

  const userMap = new Map(users.map((user) => [user.userId, user]));

  const likeCountForPostsMap = await getLikedCountForPosts(
    posts.map((p) => p.id),
    ctx
  );

  return posts.map((post) => {
    const author = userMap.get(post.authorId);

    if (!author || !author.username)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "no author found for post",
      });

    return {
      post: {
        ...post,
        likeCount: likeCountForPostsMap.get(post.id) ?? 0,
      },
      author: {
        ...author,
        username: author.username,
      },
      isLikedByUser: likedPostIdsByUser.includes(post.id),
    };
  });
};

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    const postIds = posts.map((post) => post.id);

    const likedPostIdsForUser = ctx.userId
      ? await getLikedPostIdsForUser(ctx.userId, postIds, ctx)
      : [];

    return addUserDataToPosts(posts, likedPostIdsForUser, ctx);
  }),

  getPostById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!post)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found!",
        });

      const likedPostIds = ctx.userId
        ? await getLikedPostIdsForUser(ctx.userId, [post.id], ctx)
        : [];

      return (await addUserDataToPosts([post], likedPostIds, ctx))[0];
    }),

  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: {
          authorId: input.userId,
        },
        take: 4,
        orderBy: [{ createdAt: "desc" }],
      });

      if (posts.length === 0)
        return [] as Awaited<ReturnType<typeof addUserDataToPosts>>;

      const postIds = posts.map((post) => post.id);

      const likedPostIds = ctx.userId
        ? await getLikedPostIdsForUser(ctx.userId, postIds, ctx)
        : [];

      return addUserDataToPosts(posts, likedPostIds, ctx);
    }),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed!").min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      const { success } = await ratelimit.limit(authorId);

      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }

      const post = await ctx.prisma.post.create({
        data: {
          authorId: authorId,
          content: input.content,
        },
      });

      return post;
    }),
  createLikedPostEntry: privateProcedure
    .input(
      z.object({
        postId: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const likedByUserId = ctx.userId;

      const { success } = await ratelimit.limit(likedByUserId);

      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }

      const likedPost = await ctx.prisma.likedPost.create({
        data: {
          postId: input.postId,
          userId: likedByUserId,
        },
      });

      return likedPost;
    }),
  deleteLikedPostEntry: privateProcedure
    .input(
      z.object({
        postId: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const deleted = await ctx.prisma.likedPost.deleteMany({
        where: {
          postId: input.postId,
          userId: userId,
        },
      });

      return deleted;
    }),
});
