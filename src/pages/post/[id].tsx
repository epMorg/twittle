import { useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";

const SinglePostPage: NextPage = () => { 
  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <main className="flex justify-center h-screen border-x-4">
      Post View      
      </main>
    </>
  );
};

export default SinglePostPage;
