import type { User } from "@clerk/nextjs/server";


export const trimUserInfoForClient = (user: User) => {
    return {
      userId: user.id,
      username: user.username,
      profileImage: user.profileImageUrl 
    };
  };