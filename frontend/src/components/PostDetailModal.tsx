// PostDetailModal.tsx
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import type { MediaType } from "./PostCard";
import { TextPostCover } from "./PuraTextCard"; // 假设你导出到了这里

interface PostDetailModalProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
  avatar: string;
  name: string;
  content: string;
  media: MediaType[];
  likes: number;
  liked: boolean;
  createdAt: string;
  location: string;
  tags?: string[];
  handleLike: (e: React.MouseEvent) => void;
  bgColor?: string;
  accentColor?: string;
}

export default function PostDetailModal({
  id,
  isOpen,
  onClose,
  avatar,
  name,
  content,
  media = [],
  likes,
  liked,
  handleLike,
  createdAt,
  location,
  tags,
  // 接收 props
  bgColor = "#ffffff", 
  accentColor = "#000000",
}: PostDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<string[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    if (isOpen) setCurrentMediaIndex(0);
  }, [isOpen, id]);

  const hasMultipleMedia = media.length > 1;
  const currentMedia = media[currentMediaIndex];
  // 检查是否有媒体
  const hasMedia = media && media.length > 0;
  
  const isVideo = currentMedia?.type === 'video';
  const currentUrl = currentMedia?.url; 
  const backgroundUrl = isVideo ? (currentMedia.coverUrl || undefined) : undefined;

  // ... (handleNext, handlePrev, onCommentSubmit logic keep same) ...
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMediaIndex < media.length - 1) {
      setCurrentMediaIndex((prev) => prev + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex((prev) => prev - 1);
    }
  };

  const onCommentSubmit = () => {
    if (!commentText.trim()) return;
    setLocalComments([...localComments, commentText]);
    setCommentText("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal forceMount>
             {/* ... Overlay code same ... */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm "
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>

            <Dialog.Content forceMount asChild>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                onClick={(e) => {
                  if (e.target === e.currentTarget) onClose();
                }}
              >
                 <motion.div
                  className="transform-gpu will-change-transform pointer-events-auto flex flex-col md:grid md:grid-cols-[55%_45%] h-[637px] w-full max-w-[850px] overflow-hidden rounded-xl bg-white dark:bg-neutral-900 shadow-2xl"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    perspective: 1000,
                    WebkitPerspective: 1000,
                    transformStyle: "preserve-3d", 
                  }}
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                  {/* Left Side: 55% */}
                  {/* 修改：根据是否有媒体动态调整背景色，如果有媒体用黑底，如果是纯文本用原来的颜色逻辑或者直接渲染组件 */}
                  <div className={`relative z-10 flex w-full h-full items-center justify-center aspect-[3/4] md:aspect-auto overflow-hidden ${hasMedia ? 'bg-black' : ''}`}>
                    
                    {!hasMedia ? (
                      //没有媒体时显示 TextPostCover
                      <TextPostCover 
                        content={content} 
                        bgColor={bgColor} 
                        accentColor={accentColor} 
                      />
                    ) : (
                      // 原有的媒体渲染逻辑包裹在 fragment 中
                      <>
                        {isVideo && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl"
                            style={{
                              backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
                            }}
                          />
                        )}

                        <div className="relative z-10 h-full w-full flex items-center justify-center">
                          {isVideo ? (
                            <video
                              src={currentUrl}
                              poster={currentMedia.coverUrl || undefined}
                              className="h-full w-full object-contain"
                              controls
                              autoPlay
                              loop
                              playsInline
                            />
                          ) : (
                            <motion.img
                              key={currentUrl}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              src={currentUrl || "https://via.placeholder.com/600x800"}
                              alt="post detail"
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>

                        {hasMultipleMedia && (
                          <>
                            {currentMediaIndex > 0 && (
                              <button
                                onClick={handlePrev}
                                className="absolute left-4 z-20 rounded-full bg-black/20 p-2 text-white/90 backdrop-blur-md transition hover:bg-black/40 hover:scale-105"
                              >
                                <ChevronLeft size={24} />
                              </button>
                            )}
                            {currentMediaIndex < media.length - 1 && (
                              <button
                                onClick={handleNext}
                                className="absolute right-4 z-20 rounded-full bg-black/20 p-2 text-white/90 backdrop-blur-md transition hover:bg-black/40 hover:scale-105"
                              >
                                <ChevronRight size={24} />
                              </button>
                            )}
                            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 z-20">
                              {media.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`h-1.5 rounded-full transition-all shadow-sm ${
                                    idx === currentMediaIndex
                                      ? "w-4 bg-white"
                                      : "w-1.5 bg-white/40"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right Side: 45% (保持不变) */}
                  <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-900 min-w-0 overflow-hidden">
                    {/* ... Right side content ... */}
                    {/* 为了简洁省略了右侧代码，与原代码保持一致即可 */}
                     <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 p-4 shrink-0">
                      <div className="flex items-center gap-3 pt-3">
                        <img
                          src={avatar}
                          alt={name}
                          className="h-10 w-10 rounded-full border border-gray-100 dark:border-neutral-800 object-cover mr-2"
                        />
                        <div>
                          <p className="text-[18px] text-gray-800 font-[700] dark:text-white leading-none">{name}</p>
                          <p className="text-[13px] text-gray-500 dark:text-gray-400 "> {location}</p>
                          <p className="text-[13px] text-gray-500 dark:text-gray-400 ">
                            {createdAt}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                      <div className="mb-6">
                        <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-gray-700 font-[500] dark:text-gray-200">
                          {content}
                        </p>
                        {/* Tags logic... */}
                         <div className="mt-3 flex flex-wrap gap-2">
                           {tags && tags.map((tag) => (
                             <span key={tag} className="flex items-center justify-center text-[#002B69] dark:text-blue-400 text-[14px] font-medium cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className="w-4 h-4 shirk-0 items-center justify-center"><path d="M278.7 64.7C296 68.4 307 85.4 303.3 102.7L284.2 192L410.7 192L432.7 89.3C436.4 72 453.4 61 470.7 64.7C488 68.4 499 85.4 495.3 102.7L476.2 192L544 192C561.7 192 576 206.3 576 224C576 241.7 561.7 256 544 256L462.4 256L435 384L502.8 384C520.5 384 534.8 398.3 534.8 416C534.8 433.7 520.5 448 502.8 448L421.2 448L399.2 550.7C395.5 568 378.5 579 361.2 575.3C343.9 571.6 332.9 554.6 336.6 537.3L355.7 448L229.2 448L207.2 550.7C203.5 568 186.5 579 169.2 575.3C151.9 571.6 140.9 554.6 144.6 537.3L163.8 448L96 448C78.3 448 64 433.7 64 416C64 398.3 78.3 384 96 384L177.6 384L205 256L137.2 256C119.5 256 105.2 241.7 105.2 224C105.2 206.3 119.5 192 137.2 192L218.8 192L240.8 89.3C244.4 72 261.4 61 278.7 64.7zM270.4 256L243 384L369.5 384L396.9 256L270.4 256z" /></svg>
                              {tag}
                              </span>
                           ))}
                        </div>
                      </div>
                       {/* Comments logic... */}
                       <div className="border-t border-gray-100 dark:border-neutral-800 pt-4">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          共{3 + localComments.length}条评论
                        </p>
                         {/* Comment list ... */}
                         <div className="space-y-5">
                          {["Nice post!", "Love this", "Great capture 🔥"].map((c, i) => (
                            <div key={i} className="flex gap-3 group">
                              <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                                 <img src={`https://api.dicebear.com/9.x/micah/svg?seed=${i}`} alt="user" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">User_{i + 1}</p>
                                  <span className="text-[10px] text-gray-400">2h ago</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{c}</p>
                              </div>
                            </div>
                          ))}
                          {localComments.map((c, i) => (
                             <div key={`local-${i}`} className="flex gap-3 animate-fade-in">
                               <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                                  <img src={avatar} alt="me" />
                               </div>
                               <div>
                                 <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Me</p>
                                 <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{c}</p>
                               </div>
                             </div>
                          ))}
                        </div>
                      </div>
                    </div>
                     {/* Input Area ... */}
                    <div className="border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4 shrink-0">
                      <div className="mb-3 flex items-center gap-4">
                          <button onClick={handleLike} className="flex items-center gap-1.5 group">
                              <Heart size={22} className={`transition-transform duration-200 active:scale-90 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500'}`} />
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{likes}</span>
                          </button>
                          <button className="flex items-center gap-1.5 group">
                              <MessageCircle size={22} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition" />
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{3 + localComments.length}</span>
                          </button>
                      </div>

                      <div className="relative flex items-center gap-2">
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && onCommentSubmit()}
                          placeholder="Add a comment..."
                          className="flex-1 rounded-full bg-gray-100 dark:bg-neutral-800 px-4 py-2 text-sm outline-none transition focus:bg-white focus:ring-1 focus:ring-gray-300 dark:focus:bg-neutral-900 dark:focus:ring-neutral-700 dark:text-white placeholder:text-gray-400"
                        />
                        <button
                          onClick={onCommentSubmit}
                          disabled={!commentText.trim()}
                          className="font-semibold text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-2 hover:text-blue-600 transition"
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}