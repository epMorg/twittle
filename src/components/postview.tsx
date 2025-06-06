import Link from "next/link";
import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import Image from "next/image";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState, useCallback, useEffect } from "react";
import { LikeHeart } from "./likeheart";
import { api } from "~/utils/api";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
  const { post, author, isLikedByUser } = props;

  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liked, setLiked] = useState(isLikedByUser);

  // Sync when fresh props come in (e.g. after query invalidation)
  useEffect(() => {
    setLikeCount(post.likeCount);
    setLiked(isLikedByUser);
  }, [post.likeCount, isLikedByUser]);

  const apiUtils = api.useUtils();

  const createLikeMutation = api.posts.createLikedPostEntry.useMutation({
    onError: () => {
      setLiked(false);
      setLikeCount((c) => c - 1);
    },
    onSuccess: async () => {
      void apiUtils.posts.getAll.invalidate();
      void apiUtils.posts.getPostById.invalidate({ id: post.id });
      void apiUtils.posts.getPostsByUserId.invalidate({
        userId: author.userId,
      });

      await apiUtils.posts.getAll.refetch();
      await apiUtils.posts.getPostById.refetch({ id: post.id });
      await apiUtils.posts.getPostsByUserId.refetch({ userId: author.userId });
    },
  });

  const deleteLikeMutation = api.posts.deleteLikedPostEntry.useMutation({
    onError: () => {
      setLiked(true);
      setLikeCount((c) => c + 1);
    },
    onSuccess: async () => {
      void apiUtils.posts.getAll.invalidate();
      void apiUtils.posts.getPostById.invalidate({ id: post.id });
      void apiUtils.posts.getPostsByUserId.invalidate({
        userId: author.userId,
      });

      await apiUtils.posts.getAll.refetch();
      await apiUtils.posts.getPostById.refetch({ id: post.id });
      await apiUtils.posts.getPostsByUserId.refetch({ userId: author.userId });
    },
  });

  const handleToggleLike = useCallback(() => {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      deleteLikeMutation.mutate({ postId: post.id });
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      createLikeMutation.mutate({ postId: post.id });
    }
  }, [liked, post.id, createLikeMutation, deleteLikeMutation]);

  return (
    <div className="flex gap-3 border-b border-slate-500 p-4">
      {/* Avatar */}
      <Image
        src={author.profileImageUrl}
        alt={`@${author.username}'s profile picture`}
        className="h-12 w-12 rounded-full"
        width={48}
        height={48}
      />

      {/* Post content */}
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <Link href={`/${author.username}`}>
            <span className="font-semibold hover:underline">
              @{author.username}
            </span>
          </Link>
          <span className="font-thin">·</span>
          <Link href={`/post/${post.id}`}>
            <span className="font-light hover:underline">
              {dayjs(post.createdAt).fromNow()}
            </span>
          </Link>
        </div>
        <span className="text-lg text-slate-100">{post.content}</span>

        {/* Like button */}
        <LikeHeart
          postId={post.id}
          likeCount={likeCount}
          isLiked={liked}
          onToggleLike={handleToggleLike}
        />
      </div>
    </div>
  );
};
