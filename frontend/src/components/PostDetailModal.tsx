// components/PostDetailModal.tsx  ← 终极修复版
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

export default function PostDetailModal({
  id,
  isOpen,
  onClose,
  avatar,
  name,
  content,
  image,
  likes,
  comments,
  liked,
  onLike,
  onCommentAdd,
}: {
  id: number;
  isOpen: boolean;
  onClose: () => void;
  avatar: string;
  name: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  liked: boolean;
  onLike: () => void;
  onCommentAdd: () => void;
}) {
  const [commentText, setCommentText] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal forceMount>
            {/* 背景遮罩 */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/70 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>

            {/* 主容器 - 不使用 layoutId，由图片驱动动画 */}
            <Dialog.Content forceMount asChild>
              <motion.div
                className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex w-full max-w-7xl h-full max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                  {/* 左侧：图片（唯一使用 layoutId）*/}
                 {/* 左侧图片区 */}
                  <div className="flex-1 bg-black relative overflow-hidden">
                    {image ? (
                      <motion.div className="w-full h-full">
                        <motion.img
                          layoutId={`image-${id}`}
                          src={image}
                          alt="post"
                          className="w-full h-full object-cover"
                          style={{ borderRadius: "24px 0 0 24px" }}
                        />
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        无图片
                      </div>
                    )}
                  </div>

                  {/* 右侧：内容区 */}
                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-96 md:w-[420px] flex flex-col bg-white"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b">
                      <div className="flex items-center gap-3">
                        <img src={avatar} alt={name} className="w-11 h-11 rounded-full" />
                        <div>
                          <p className="font-semibold">{name}</p>
                          <p className="text-xs text-gray-500">2小时前</p>
                        </div>
                      </div>
                      <Dialog.Close className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={22} />
                      </Dialog.Close>
                    </div>

                    {/* 内容 */}
                    <div className="p-5 border-b">
                      <p className="text-sm whitespace-pre-line leading-relaxed">{content}</p>
                      <div className="flex items-center gap-6 mt-5">
                        <button onClick={onLike} className="flex items-center gap-2 hover:text-red-500 transition">
                          <Heart size={24} className={liked ? "fill-red-500 text-red-500" : ""} />
                          <span>{likes}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <MessageCircle size={24} />
                          <span>{comments}</span>
                        </div>
                      </div>
                    </div>

                    {/* 评论区 */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      {["太好看了！", "支持楼主", "求同款"].map((c, i) => (
                        <div key={i} className="flex gap-3">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=comment${i}`}
                            className="w-9 h-9 rounded-full"
                            alt=""
                          />
                          <div>
                            <p className="font-medium text-sm">用户{i + 1}</p>
                            <p className="text-sm text-gray-700">{c}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 输入框 */}
                    <div className="p-4 border-t">
                      <div className="flex gap-3">
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && commentText.trim() && (onCommentAdd(), setCommentText(""))}
                          placeholder="说点什么..."
                          className="flex-1 px-4 py-2.5 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => commentText.trim() && (onCommentAdd(), setCommentText(""))}
                          className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-white hover:text-black transition flex items-center gap-2"
                        >
                          <Send size={16} />
                          发送
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}