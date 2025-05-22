import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { error } from "console";
import { trimUserInfoForClient } from "~/server/helpers/TrimUserInfoForClient";


export const profileRouter = createTRPCRouter({

    getUserByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
        const [user] = await clerkClient.users.getUserList({
            username: [input.username],
        });

        if (!user) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "User not found",
            });
        }

        return trimUserInfoForClient(user)
    })
})
