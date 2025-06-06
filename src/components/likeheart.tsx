import { FaHeart, FaRegHeart } from "react-icons/fa";

type LikeHeartProps = {
  postId: string;
  likeCount: number;
  isLiked: boolean;
  onToggleLike: () => void;
};

export const LikeHeart = (props: LikeHeartProps) => {
  const { likeCount, isLiked, onToggleLike } = props;

  return (
    <div
      className="flex cursor-pointer items-center gap-1 transition-colors duration-300"
      onClick={() => {
        onToggleLike();
      }}
      role="button"
      aria-pressed={isLiked}
      tabIndex={0}
    >
      {isLiked ? (
        <FaHeart className="text-red-500 transition-all duration-300" />
      ) : (
        <FaRegHeart className="text-gray-500 transition-all duration-300" />
      )}
      <span className="text-sm text-slate-600">{likeCount}</span>
    </div>
  );
};
