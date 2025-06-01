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

const getLikedPostIds = async (
  userId: string,
  postIds: string[],
  ctx: Context
) => {
  const likedPosts = await ctx.prisma.like.findMany({
    where: {
      userId: userId,
      postId: {
        in: postIds,
      },
    },
    select: {
      postId: true,
    },
  });

  return likedPosts.map((post) => post.postId);
};

const addUserDataToPosts = async (posts: Post[], likedPostIds: string[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(trimUserInfoForClient);

  const userMap = new Map(users.map((user) => [user.userId, user]));

  return posts.map((post) => {
    const author = userMap.get(post.authorId);

    if (!author || !author.username)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "no author found for post",
      });

    return {
      post: post,
      author: {
        ...author,
        username: author.username,
      },
      isLiked: likedPostIds.includes(post.id),
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

    const likedPostIds = ctx.userId
      ? await getLikedPostIds(ctx.userId, postIds, ctx)
      : [];

    return addUserDataToPosts(posts, likedPostIds);
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
        ? await getLikedPostIds(ctx.userId, [post.id], ctx)
        : [];

      return (await addUserDataToPosts([post], likedPostIds))[0];
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
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });

      if (posts.length === 0)
        return [] as Awaited<ReturnType<typeof addUserDataToPosts>>;

      const postIds = posts.map((post) => post.id);

      const likedPostIds = ctx.userId
        ? await getLikedPostIds(ctx.userId, postIds, ctx)
        : [];

      return addUserDataToPosts(posts, likedPostIds);
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
});
