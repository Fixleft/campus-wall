// components/PostCard.tsx
import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import PostDetailModal from "./PostDetailModal";
import { motion } from "framer-motion";

export default function PostCard({
  id,
  avatar,
  name,
  content,
  image,
}: {
  id: number;
  avatar: string;
  name: string;
  content: string;
  image?: string;
}) {
  const [likes, setLikes] = useState(Math.floor(Math.random() * 300));
  const [comments, setComments] = useState(Math.floor(Math.random() * 80));
  const [liked, setLiked] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <>
      {/* 关键：外层 div 不要 layoutId！ */}
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer group overflow-hidden rounded-xl bg-white dark:bg-neutral-900 shadow-sm hover:shadow-lg transition-all duration-300"
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <img src={avatar} alt={name} className="w-10 h-10 rounded-full ring-2 ring-white" />
            <div className="font-medium text-sm">{name}</div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
            {content}
          </p>

          {/* 关键：只有图片用 layoutId + 强制圆角 */}
          {image && (
            <motion.div
              className="mb-3 rounded-xl overflow-hidden" // 包一层保证裁剪
            >
              <motion.img
                layoutId={`image-${id}`} // 唯一动画源！
                src={image}
                alt="post"
                className="w-full h-56 object-cover"
                style={{ borderRadius: "12px" }} // 强制圆角，永不丢失！
              />
            </motion.div>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <button onClick={handleLike} className="flex items-center gap-2 hover:text-red-500 transition">
              <Heart size={18} className={liked ? "fill-red-500 text-red-500" : ""} />
              <span>{likes}</span>
            </button>
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span>{comments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      <PostDetailModal
        id={id}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        avatar={avatar}
        name={name}
        content={content}
        image={image}
        likes={likes}
        comments={comments}
        liked={liked}
        onLike={() => {
          setLiked(!liked);
          setLikes(prev => liked ? prev - 1 : prev + 1);
        }}
        onCommentAdd={() => setComments(c => c + 1)}
      />
    </>
  );
}