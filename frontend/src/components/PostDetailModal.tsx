// PostDetailModal.tsx
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import type { MediaType } from "./PostCard";
import { TextPostCover } from "./PuraTextCard"; 
import CommentSection from "./CommentSection";
import { formatRelativeTime } from "@/utils/dateUtils";
import AddFriendButton from "./AddFriendButton";
import UserAvatar from "./UserAvatar";
import {useUser} from "@/context/UserContext";

interface PostDetailModalProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
  uid: string;
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
  isFriend: boolean;
  isAnonymous?: boolean;
}

export default function PostDetailModal({
  id,
  isOpen,
  uid,
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
  isFriend,
  isAnonymous = false,
}: PostDetailModalProps) {
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
  const {user} = useUser();
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


  const PostHeaderContent = (
    <div>
      {/* User Info Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <UserAvatar avatar={avatar} uid={uid} size="w-12 h-12" />
          <div>
            <p className="text-[18px] text-gray-800 font-[700] dark:text-white leading-none">{name}</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
               {location}  {formatRelativeTime(createdAt)}
            </p>
            
          </div>
        </div>
        {!isAnonymous && <AddFriendButton 
        targetUid={uid} 
        variant="icon" // 只显示图标，节省空间
        size="sm" 
        className="text-gray-400 hover:bg-gray-100 bg-transparent shadow-none" // 自定义样式覆盖默认蓝底
        initialIsFriend={isFriend} // 传入是否为好友的初始状态
    />}
      </div>

      {/* Content Text */}
      <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-gray-700 font-[500] dark:text-gray-200">
        {content}
      </p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center justify-center text-[#002B69] dark:text-blue-400 text-[14px] font-medium cursor-pointer hover:underline"
            >
              <span className="mr-1">#</span>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

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

            <Dialog.Content forceMount asChild
             onPointerDownOutside={(e) => {
                e.preventDefault(); 
              }}
              // 2. 防止其他交互导致的误关闭
              onInteractOutside={(e) => {
                e.preventDefault();
              }}
            >
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
                  <div className="h-full w-full bg-white dark:bg-neutral-900 overflow-hidden flex flex-col">
                    <CommentSection 
                        postId={id}
                        currentUserId={user?.uid}
                        postLikes={likes}
                        postLiked={liked}
                         onPostLike={(e) => handleLike(e)}
                        headerContent={PostHeaderContent} // 将文案部分传入
                    />
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