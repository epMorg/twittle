import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";

const filterUserForClient = (user: User) => {
  return {
    userId: user.id,
    username: user.username,
    profileImage: user.profileImageUrl 
  }
}

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });
    
    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map(post=> post.authorId),
        limit: 100,
      })
      ).map(filterUserForClient); 
    
      return posts.map((post) => {
        const author = users.find(user => user.userId === post.authorId)

        if (!author || !author.username) 
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR",
            message: "no author found for post"
          })

        return {
          post,
          author: {
            ...author,
            username: author.username
          }
        }
      })
  }),
});
