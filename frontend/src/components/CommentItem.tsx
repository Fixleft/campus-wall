import { memo } from "react";
import { Heart} from "lucide-react";
import { motion } from "framer-motion";
import type { CommentVO } from "./CommentSection"; // 假设这是你存放接口定义的地方
import { formatRelativeTime } from "@/utils/dateUtils";
import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import UserAvatar from "./UserAvatar";

// --- CommentItem Props 定义 ---
interface CommentItemProps {
  comment: CommentVO;
  isRoot?: boolean;
  currentUserId?: string;
  expandedFloors: Record<number, CommentVO[]>;
  loadingFloors: Record<number, boolean>;
  // 回调函数们
  onReply: (target: { id: number; uid: string; nickname: string; rootId: number }) => void;
  onDelete: (commentId: number, isRoot: boolean) => void;
  onLike: (comment: CommentVO, isReply: boolean, rootId?: number) => void;
  onToggleReplies: (rootId: number) => void;
}



// --- 关键点1：移到外部，并使用 memo 防止无关更新导致的渲染 ---
const CommentItem = memo(({ 
  comment, 
  isRoot = false, 
  currentUserId,
  expandedFloors,
  loadingFloors,
  onReply,
  onDelete,
  onLike,
  onToggleReplies
}: CommentItemProps) => {
  const isOwner = currentUserId === comment.userId;
 const aspectRatioClass = useMemo(() => {
    
    const image = comment.images?.[0]; 
 
    if (!image || !image.width || !image.height) {
      return "aspect-[3/4]"; // 默认比例 (竖向)
    }

  
    const ratio = image.width / image.height;

   
    if (ratio > 1.2) {
      return "aspect-[4/3]"; 
    } else if (ratio < 0.8) {
      return "aspect-[3/4]";
    } else {
      return "aspect-square";
    }
}, [comment.images]); 

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  return (
    <div className={`flex gap-3 group ${!isRoot ? 'mt-3 pl-2' : ''}`}>
      {/* 头像 */}
     {isRoot ? (
        <UserAvatar 
          avatar={comment.userAvatar}
          uid={comment.userId}
          size="w-10 h-10"
          />):(
        <UserAvatar 
          avatar={comment.userAvatar} 
          uid={comment.userId}
          size="w-8 h-8"
        />
          )

     }
      
      <div className="flex-1 min-w-0">
        {/* 用户名 + 时间 */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {comment.userNickname} 
          </span>
          <span className="text-[10px] text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
        </div>

       

        {/* 内容 */}
        <p className={`text-sm text-gray-600 dark:text-gray-300 mt-0.5 break-words ${comment.isDeleted ? 'text-gray-400 italic' : ''}`}>
            {comment.replyToUid &&  
              <span className="text-gray-400 font-normal ml-1 text-xs">
                <span className="text-black">回复</span> @{comment.replyToNickname || comment.replyToUid}：
              </span>}
          {comment.content}
        </p>

        {/* 评论图片展示 */}
{!comment.isDeleted && comment.images && comment.images.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-2">
    {comment.images.map((item, index) => {
      return (
        <div 
          key={item.url + index} 
          className={`${aspectRatioClass} max-h-45 relative overflow-hidden rounded-lg border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900`}
          style={{ width: 'fit-content', maxWidth: '100%' }} 
        >
            <img
              src={item.url}
              alt="comment attachment"
              loading="lazy"
              className="object-cover h-full w-full cursor-zoom-in hover:opacity-95 transition-opacity"
              onClick={(e) => {
                  e.stopPropagation(); 
                  setPreviewUrl(item.url);
              }}
            />
        </div>
      );
    })}
  </div>
)}

<Dialog.Root open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <Dialog.Portal>
          
          <Dialog.Overlay asChild>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm"
            />
          </Dialog.Overlay>

          {/* 内容区域 */}
          <Dialog.Content asChild>
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 outline-none">
              
              {/* 图片容器 */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-full max-h-full outline-none"
                onClick={(e) => e.stopPropagation()} // 防止点击图片时关闭
              >
                <img
                    src={previewUrl || ""}
                    alt="Preview"
                    className="max-h-[90vh] max-w-[90vw] object-contain rounded-md shadow-2xl select-none"
                />

                {/* 关闭按钮 */}
                <Dialog.Close asChild>
                    <button 
                        className="absolute -top-12 right-0 md:top-5 md:right-5 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <IconX size={24} />
                    </button>
                </Dialog.Close>
              </motion.div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
        {/* 操作栏 */}
        <div className="flex items-center gap-4 mt-1.5">
           {!comment.isDeleted && (
               <>
                  <button 
                      onClick={() => onReply({ 
                          id: comment.id, 
                          uid: comment.userId,
                          nickname: comment.userNickname, // 注意这里是用 name 还是 id，根据你 replyTarget 的定义
                          rootId: isRoot ? comment.id : comment.rootParentId 
                      })}
                      className="text-xs font-medium text-gray-400 hover:text-blue-500 transition cursor-pointer"
                  >
                      回复
                  </button>
                  {isOwner && (
                      <button 
                          onClick={() => onDelete(comment.id, isRoot)}
                          className="text-xs font-medium text-gray-400 hover:text-red-500 transition cursor-pointer flex items-center gap-0.5"
                      >
                          删除
                      </button>
                  )}
               </>
           )}
           
           <button 
              onClick={() => onLike(comment, !isRoot, isRoot ? undefined : comment.rootParentId)}
              className="ml-auto flex items-center gap-1 group/like"
           >
              <Heart size={14} className={`transition-colors ${comment.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover/like:text-red-500'}`} />
              {comment.likeCount > 0 && <span className="text-xs text-gray-400">{comment.likeCount}</span>}
           </button>
        </div>

        {/* 楼中楼展示逻辑 (递归调用自己) */}
        {isRoot && (
          <div className="mt-2">
              {comment.replyCount > 0 && !expandedFloors[comment.id] && (
                  <button 
                      onClick={() => onToggleReplies(comment.id)}
                      className="flex items-center gap-1 text-[12px] font-semibold text-neutral-600 my-1"
                  >
                      <div className="w-6 h-[1px] bg-black"></div>
                      展开 {comment.replyCount} 条回复
                  </button>
              )}

              {loadingFloors[comment.id] && <div className="text-xs text-gray-400 pl-8">加载回复中...</div>}

              {expandedFloors[comment.id] && (
                  <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pl-2 border-l-2 border-gray-100 dark:border-neutral-800 space-y-3"
                  >
                      {expandedFloors[comment.id].map(reply => (
                          <CommentItem 
                            key={reply.id} 
                            comment={reply} 
                            isRoot={false} // 递归时设为 false
                            // 必须透传 props
                            currentUserId={currentUserId}
                            expandedFloors={expandedFloors}
                            loadingFloors={loadingFloors}
                            onReply={onReply}
                            onDelete={onDelete}
                            onLike={onLike}
                            onToggleReplies={onToggleReplies}
                          />
                      ))}
                      <button 
                           onClick={() => onToggleReplies(comment.id)}
                           className="text-xs text-gray-400 hover:text-gray-600 mt-2 block"
                      >
                          收起回复
                      </button>
                  </motion.div>
              )}
          </div>
        )}
      </div>
    </div>
  );
});

export default CommentItem;