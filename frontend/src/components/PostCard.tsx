import { Heart, Play, Layers } from "lucide-react";
import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import PostDetailModal from "./PostDetailModal";
import { TextPostCover } from "./PuraTextCard";
import { Trash2 ,Edit2 } from "lucide-react"; 
import api from "@/utils/api"
import ConfirmDialog from "./ConfirmDialog";
import EditPostModal from "./EditPostModal";
import { AnimatePresence, motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 1. 更新类型定义
export interface MediaType {
  type: 'image' | 'video';
  url: string;
  coverUrl?: string | null;
  width?: number;  // 新增
  height?: number; // 新增
}

interface PostCardProps {
  id: number;
  avatar: string;
  uid: string;
  name: string;
  content: string;
  media: MediaType[];
  createdAt: string;
  likeCount: number;
  liked: boolean;
  location: string;
  tags?: string[];
  isOwner?: boolean; 
  onLike: (postId: number, currentlyLiked: boolean) => void;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, newContent: string, newTags: string[]) => void;
  isFriend: boolean;
  isAnonymous?: boolean; 
  status?: number;
}

const COLORS = [
  "#F87979", "#C09CF8", "#F496E5", "#FADBD8", 
  "#E8DAEF", "#D6EAF8", "#D1F2EB", "#FCF3CF", "#ccf6f4"
];

export default function PostCard({
  id,
  avatar,
  uid,
  name,
  content,
  media = [],
  createdAt,
  likeCount,
  liked,
  location,
  tags,
  isOwner,
  onLike,
  onDelete,
  onUpdate,
  isFriend,
  isAnonymous = false,
  status = 0,
}: PostCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bgColor, setBgColor] = useState(COLORS[0]);
  const [isHovering, setIsHovering] = useState(false); // 新增 hover 状态
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
  if (errorMessage) {
    const timer = setTimeout(() => {
      setErrorMessage(null); 
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [errorMessage]); 

  // Color Logic
  const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  function lightenOrDarkenHex(hex: string | undefined, percent: number) {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return "#000000";
    const num = parseInt(hex.replace("#", ""), 16),
      amt = Math.round(2.55 * percent * 100),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  useEffect(() => {
    setBgColor(getRandomColor());
  }, []);

  const darkedColor = lightenOrDarkenHex(bgColor, -0.2);

  // === 核心逻辑修改开始 ===
  const coverMedia = media.length > 0 ? media[0] : null;
  const isVideo = coverMedia?.type === 'video';
  const isMultiple = media.length > 1;
  
  const coverImageUrl = isVideo 
    ? (coverMedia?.coverUrl || null) 
    : coverMedia?.url;

  // 计算智能布局的 Class
  const aspectRatioClass = useMemo(() => {
    // 如果没有媒体或没有宽高数据，默认使用 3:4 (Portrait)
    if (!coverMedia || !coverMedia.width || !coverMedia.height) {
      return "aspect-[3/4]";
    }

    const ratio = coverMedia.width / coverMedia.height;

    if (ratio > 1.2) {
      return "aspect-[4/3]"; // 宽图/横屏视频
    } else if (ratio < 0.8) {
      return "aspect-[3/4]"; // 长图/竖屏视频
    } else {
      return "aspect-square"; // 方图
    }
  }, [coverMedia]);
  // === 核心逻辑修改结束 ===

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(id, liked);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const truncatedContent = content.length > 19 ? content.slice(0, 19) + '...' : content;
  const truncatedDescription = content.length > 50 ? content.slice(0, 50) + '...' : content;

   const openDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/posts/${id}`);
      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error("删除失败", error);
      setErrorMessage("删除失败，请稍后重试");
    } finally {
      // 无论成功失败，都关闭弹窗
      setDeleteDialogOpen(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (newContent: string, newTags: string[]) => {
    if (onUpdate) {
      onUpdate(id, newContent, newTags);
    }
  };


  return (
    <>
      <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 left-4 right-4 z-50"
                  >
                    <Alert variant="destructive" className="rounded-lg bg-zinc-900 border border-red-900 text-red-500 shadow-xl py-4">
                      <AlertDescription className="text-center text-sm">{errorMessage}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
      {/* 挂载编辑弹窗 */}
      <EditPostModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        postId={id}
        initialContent={content}
        initialTags={tags}
        onSuccess={handleEditSuccess}
      />
       <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        title="删除帖子"
        message="确定要删除这条帖子吗？此操作无法恢复。"
        confirmText="确定删除"
        cancelText="取消"
        onConfirm={executeDelete} 
        onCancel={() => setDeleteDialogOpen(false)}
      />
      <div
        onClick={() => setIsOpen(true)}
        className="break-inside-avoid mb-4 cursor-pointer group rounded-[16px] bg-white dark:bg-neutral-900 transition-all duration-300 hover:shadow-lg border border-transparent dark:border-neutral-800"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`relative w-full ${aspectRatioClass} overflow-hidden rounded-[16px] bg-gray-100 dark:bg-neutral-800`}>
          
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none" />

          {coverMedia ? (
            <div className="w-full h-full relative">
              
            
              {coverImageUrl && (
                <img
                  src={coverImageUrl}
                  alt="post cover"
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    (isVideo && isHovering) ? 'opacity-0' : 'opacity-100'
                  }`}
                  loading="lazy"
                />
              )}

              {/* 如果是视频，Video 标签放在图片下方，或者 hover 时显示 */}
              {isVideo && (
                 <div className={`absolute inset-0 w-full h-full bg-black ${isHovering ? 'z-10' : '-z-10'}`}>
                   <video 
                     ref={videoRef}
                     src={coverMedia.url} // 视频实际播放地址
                     className="w-full h-full object-cover"
                     muted
                     loop
                     playsInline
                   />
                    {/* Play Indicator (Only visible when not hovering) */}
                   <div className="absolute top-2 right-2 z-30 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
                      <div className="bg-black/30 backdrop-blur-sm rounded-full p-1.5">
                          <Play size={12} className="text-white fill-white ml-0.5" />
                      </div>
                   </div>
                 </div>
              )}
              
              {isMultiple && (
                <div className="absolute top-2 right-2 z-30">
                  <div className="bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                    <Layers size={12} className="text-white" />
                  </div>
                </div>
              )}
            </div>
          ) : (
           <TextPostCover 
              content={truncatedContent} 
              bgColor={bgColor} 
              accentColor={darkedColor} 
            />
          )}
        </div>

        <div className="px-3 py-3">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 mb-2 leading-snug">
            {truncatedDescription}
          </p>
          
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row items-center gap-2 group/author">
              <img src={avatar} alt={name} className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-100" />
              <span className="text-xs text-gray-500 font-medium truncate max-w-[100px]">{name}</span>
            </div>
            {status === 1 && (
              <div className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                屏蔽中
              </div>
            )
            }
             {isOwner && (
              <>
                <button 
                         onClick={handleEditClick}
                         className="text-gray-400 hover:text-blue-500 transition-colors"
                         title="编辑帖子"
                       >
                         <Edit2 size={16} />
                </button>
                <button 
                  onClick={openDeleteDialog}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="删除帖子"
                >
                  <Trash2 size={16} />
                </button>
              </>
              )}
            <button onClick={handleLike} className="flex items-center gap-1 group/like">
              <Heart 
                size={16} 
                className={`transition-colors duration-200 ${liked ? "fill-red-500 text-red-500" : "text-gray-400 group-hover/like:text-gray-600"}`} 
              />
              <span className="text-xs text-gray-500 group-hover/like:text-gray-700">{likeCount}</span>
            </button>
          </div>
        </div>

      </div>
      
      <PostDetailModal
        id={id}
        isOpen={isOpen}
        uid={uid}
        onClose={() => setIsOpen(false)}
        avatar={avatar}
        name={name}
        content={content}
        media={media}
        likes={likeCount}
        liked={liked}
        createdAt={createdAt}
        location={location}
        tags={tags}
        bgColor={bgColor}
        accentColor={darkedColor}
        handleLike={handleLike}
        isFriend={isFriend}
        isAnonymous={isAnonymous}
      />
    </>
  );
}