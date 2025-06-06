import Head from "next/head";
import type { GetStaticProps, NextPage } from "next";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";
import { PostView } from "~/components/postview";
import { PageLayout } from "~/components/layout";
import ErrorView from "~/components/errorview";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data, isLoading, isFetching, isFetched } =
    api.posts.getPostById.useQuery({ id });

  const stillFetchingFreshData = isFetched && isFetching;

  if (!data)
    return (
      <PageLayout>
        <ErrorView code={404} message={"Post not found!"} />
      </PageLayout>
    );

  return (
    <>
      <Head>
        <title>{`${data.post.content} - ${data.author.username}`} </title>
      </Head>
      <PageLayout>
        <PostView
          post={data.post}
          author={data.author}
          isLikedByUser={data.isLikedByUser}
        />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;
  if (typeof id !== "string") throw new Error("no slug");

  await ssg.posts.getPostById.prefetch({
    id: id,
  });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id: id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
