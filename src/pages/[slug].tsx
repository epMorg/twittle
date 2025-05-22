import { useUser } from "@clerk/nextjs";
import { GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";

const ProfilePage: NextPage = () => { 

  const {data, isLoading} = api.profile.getUserByUsername.useQuery({
    username: "epMorg",
  })

  if (isLoading) return <div>Loading...</div>

  if(!data) return <div></div>

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <main className="flex justify-center h-screen border-x-4">
      <div>{data.username}</div> 
      </main>
    </>
  );
};

export default ProfilePage;
