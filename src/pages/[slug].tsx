import { useUser } from "@clerk/nextjs";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '~/server/api/root';
import superjson  from 'superjson'
import { prisma } from "~/server/db"

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {  
  const {data} = api.profile.getUserByUsername.useQuery({
    username,
  });

  if(!data) return <div></div>

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <main className="flex justify-center h-screen border-x-4">
      <div>{data.username}</div> 
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson,
  });

   const slug = context.params?.slug;
   if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");
  await ssg.profile.getUserByUsername.prefetch({
    username: username,
  })

  return {
    props:{
      trpcSate: ssg.dehydrate(),
      username: username,
    }
  }
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking"}
}

export default ProfilePage;
