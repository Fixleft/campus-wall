import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import CommentItem from "./CommentItem";
import { CommentAttachmentButton } from "./CommentAttachmentButton";
import type { CommentAttachmentRef } from "./CommentAttachmentButton";
import ConfirmDialog from "./ConfirmDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface CommentVO {
  id: number;
  postId: number;
  content: string;
  userNickname: string;
  userAvatar: string;
  userId: string; // uid
  createdAt: string;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  parentId: number;
  rootParentId: number;
  replyToUid?: string;
  isDeleted: boolean;
  replyToNickname?: string;
  images?: {
    url: string;
    type: 'image' | 'video' | string; // 后端可能存为 "image/jpeg" 或简单的 "image"
    width?: number;
    height?: number;
  }[];
}

type DeleteTarget = { id: number; isRoot: boolean } | null;

interface CommentSectionProps {
  postId: number;
  currentUserId?: string; // 当前登录用户ID，用于判断是否是自己发的评论
  postLikes: number; // 帖子的点赞数
  postLiked: boolean; // 帖子是否已赞
  onPostLike: (e: React.MouseEvent) => void;
  headerContent?: React.ReactNode; // 帖子正文+标签，作为头部插入滚动区
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  width: number;
  height: number;
}

const CommentsApi = {
  getFloors: async (postId: number, page: number) => {
     const res = await api.get(`/comments/post/${postId}`, {
      params: { page, size: 10 }
    });
     return res.data; 
  },
  getReplies: async (rootId: number) => {
    const res = await api.get(`/comments/${rootId}/replies`);
    return res.data.data;
  },
  postComment: async (data: any) => {
    return await api.post(`/comments/publish`, data);
  },
  likeComment: async (id: number) => { 
    return await api.post(`/comments/${id}/like`);
    },
  unlikeComment: async (id: number) => {
    return await api.post(`/comments/${id}/unlike`);
    },
  deleteComment: async (id: number) => {
    return await api.delete(`/comments/${id}`);
  },
};

export default function CommentSection({
  postId,
  currentUserId,
  postLikes,
  postLiked,
  onPostLike,
  headerContent,
}: CommentSectionProps) {
  // --- State ---
  const [comments, setComments] = useState<CommentVO[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [inputText, setInputText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ id: number; uid: string; nickname: string; rootId: number } | null>(null);
  const [expandedFloors, setExpandedFloors] = useState<Record<number, CommentVO[]>>({}); // 存储展开的楼中楼
  const [loadingFloors, setLoadingFloors] = useState<Record<number, boolean>>({});
  const attachmentRef = useRef<CommentAttachmentRef>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null); 
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]); 

  // --- Effects ---
  // 初始化加载一级评论 (这里简化只加载第一页，实际可做无限滚动)
  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const data = await CommentsApi.getFloors(postId, 0);
      setComments(data.content);
      setTotalComments(data.totalItems);
    } catch (e) {
      console.error(e);
    }
  };

  // 加载楼中楼
  const toggleReplies = async (rootId: number) => {
    // 1. 如果已经展开，则收起
    if (expandedFloors[rootId]) {
      const newExpanded = { ...expandedFloors };
      delete newExpanded[rootId];
      setExpandedFloors(newExpanded);
      return;
    }

    // 2. 设置 loading 状态
    setLoadingFloors(prev => ({ ...prev, [rootId]: true }));
    
    try {
      // 3.【关键】调用真实 API 获取子回复
      const replies = await CommentsApi.getReplies(rootId);
      
      // 4. 更新状态
      setExpandedFloors(prev => ({ ...prev, [rootId]: replies }));
    } catch (e) {
      console.error("加载回复失败", e);
    } finally {
      // 5. 移除 loading
      setLoadingFloors(prev => ({ ...prev, [rootId]: false }));
    }
  };

  // --- Actions ---

  const handlePost = async () => {
    if (!inputText.trim() && files.length === 0) return;
     let uploadedMediaItems: MediaItem[] = [];
    try{
       // Step 1: 上传文件
     

      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await api.post<MediaItem>("/files/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return res.data;
        });

        uploadedMediaItems = await Promise.all(uploadPromises);
      }
  
    const payload = {
      postId,
      content: inputText,
      images: uploadedMediaItems, 
      // 确保 parentId 传的是评论ID
      parentId: replyTarget ? replyTarget.id : 0,
      // 确保 replyToUid 传的是用户ID (uid)
      replyToUid: replyTarget ? replyTarget.uid : undefined, 
    };

    
      // 1. 调用接口
      const result = await CommentsApi.postComment(payload);
      
      // 2. 解包数据 (result.data 是 Result对象, result.data.data 是 CommentVO)
      let newComment = result.data.data;

      // 安全校验
      if (!newComment) {
         console.error("数据异常：后端未返回新评论对象", result);
         return;
      }

      if (replyTarget) {
          newComment = {
              ...newComment,
              replyToNickname: replyTarget.nickname 
          };
      }

      if (payload.parentId === 0) {
        setComments([newComment, ...comments]);
        setTotalComments(prev => prev + 1);
      } else {
        const rootId = replyTarget!.rootId === 0 ? replyTarget!.id : replyTarget!.rootId;
        
        setExpandedFloors(prev => {
            const currentReplies = prev[rootId] || [];
            return {
                ...prev,
                [rootId]: [...currentReplies, newComment]
            };
        });
        
        setComments(prev => prev.map(c => 
          c.id === rootId ? { ...c, replyCount: c.replyCount + 1 } : c
        ));
      }
      attachmentRef.current?.clear(); 
      setInputText("");
      setReplyTarget(null);
      setFiles([]);
    } catch (e) {
      const error = e as any; 
      setErrorMessage(error.response?.data?.message || "评论发布失败，请稍后重试。");
    }
  };

  // A. 点击垃圾桶图标时调用这个函数
const openDeleteConfirm = (commentId: number, isRoot: boolean) => {
    // 只是设置状态，让弹窗显示出来
    setDeleteTarget({ id: commentId, isRoot: isRoot });
};

// B. 点击弹窗“确认”按钮时调用这个函数（真正的删除逻辑放在这里）
const executeDelete = async () => {
    if (!deleteTarget) return;

    const { id: commentId, isRoot } = deleteTarget;

    try {
        // 1. 调用真实 API
        await CommentsApi.deleteComment(commentId);
        
        // 2. 更新 UI
        if(isRoot) {
            setComments(comments.filter(c => c.id !== commentId));
            setTotalComments(prev => prev - 1);
        } else {
            const newExpanded = { ...expandedFloors };
            Object.keys(newExpanded).forEach(key => {
                const k = Number(key);
                newExpanded[k] = newExpanded[k].filter(c => c.id !== commentId);
            });
            setExpandedFloors(newExpanded);
        }
    } catch(e) {
        console.error("删除失败", e);
        // 这里可以使用 Toast 提示
        setErrorMessage("删除失败");
    } finally {
        // 无论成功失败，都要关闭弹窗
        setDeleteTarget(null);
    }
};

  const handleLikeComment = async (comment: CommentVO, isReply: boolean, rootId?: number) => {
    // 1. 乐观更新 UI (让用户立刻看到变红，防止等待感)
    const updateList = (list: CommentVO[]) => list.map(c => {
        if (c.id === comment.id) {
            return {
                ...c,
                isLiked: !c.isLiked,
                likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1
            };
        }
        return c;
    });

    // 更新一级评论列表
    if (!isReply) {
        setComments(updateList(comments));
    } 
    // 更新楼中楼列表
    else if (rootId && expandedFloors[rootId]) {
        setExpandedFloors({
            ...expandedFloors,
            [rootId]: updateList(expandedFloors[rootId])
        });
    }

    try {
        // 2.【关键】调用真实 API
        if (comment.isLiked) {
            // 原来是赞，现在要取消
            await CommentsApi.unlikeComment(comment.id);
        } else {
            // 原来没赞，现在要点赞
            await CommentsApi.likeComment(comment.id);
        }
    } catch (e) {
        console.error("点赞操作失败", e);
        // 如果失败了，应该回滚 UI (这里省略回滚逻辑，通常不需要)
    }
  };

   const handleFilesSelected = (files: File[]) => {
    setFiles(files);
  };

  // --- Render Helper ---
  
  

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-neutral-900 min-w-0">
      <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 left-4 right-4 z-50"
                  >
                    <Alert variant="destructive" className="rounded-lg bg-zinc-900 border border-red-900 text-red-500 shadow-xl py-2">
                      <AlertDescription className="text-center text-sm">{errorMessage}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
      </AnimatePresence>
      {/* 滚动区域: 包含帖子文案(Header) + 评论列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* 帖子正文区 (从外部传入) */}
        {headerContent && (
            <div className="p-4 pb-2">
                {headerContent}
            </div>
        )}

        {/* 评论区标题 */}
        <div className="px-4 pt-2 border-t border-gray-100 dark:border-neutral-800">
            <p className="text-[13px] font-bold uppercase tracking-wide text-black mb-4 dark:text-white">
               共 {totalComments} 条评论
            </p>
            
            {/* 评论列表 */}
            <div className="space-y-6 pb-4">
               {comments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        暂无评论，快来抢沙发~
                    </div>
                ) : (
                    comments.map(c => (
                        // 关键修改：在这里调用外部的 CommentItem 并传递 Props
                        <CommentItem 
                            key={c.id} 
                            comment={c} 
                            isRoot={true}
                            currentUserId={currentUserId}
                            expandedFloors={expandedFloors}
                            loadingFloors={loadingFloors}
                            onReply={(target) => setReplyTarget(target)} // 传递 setState
                            onDelete={openDeleteConfirm}
                            onLike={handleLikeComment}
                            onToggleReplies={toggleReplies}
                        />
                    ))
                )}
      </div>
    </div>
</div>

      {/* 底部固定区：帖子交互 + 输入框 */}
      <div className="border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4 shrink-0 z-20">
        <div className="mb-3 flex items-center gap-4">
            <button onClick={onPostLike} className="flex items-center gap-1.5 group">
                <Heart size={22} className={`transition-transform duration-200 active:scale-90 ${postLiked ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500'}`} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{postLikes}</span>
            </button>
            <div className="flex items-center gap-1.5">
                <MessageCircle size={22} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{totalComments}</span>
            </div>
            <CommentAttachmentButton onChange={handleFilesSelected}  ref={attachmentRef} />
        </div>

        {/* 回复状态提示 */}
        <AnimatePresence>
            {replyTarget && (
                <motion.div 
                    key="reply-indicator"
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800 px-3 py-1.5 rounded-t-lg text-xs text-gray-500 mb-1"
                >
                    <span>回复 @{replyTarget.nickname}</span>
                    <button onClick={() => setReplyTarget(null)} className="hover:text-red-500">取消</button>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="relative flex items-center gap-2">
            <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
                placeholder={replyTarget ? `回复 @${replyTarget.nickname}...` : "说点什么..."}
                className="flex-1 rounded-[8px] bg-gray-100 dark:bg-neutral-800 px-4 py-2 text-sm outline-none transition focus:bg-white focus:ring-1 focus:ring-black dark:focus:bg-neutral-900 dark:focus:ring-blue-500 dark:text-white placeholder:text-gray-400"
            />
            <button
                onClick={handlePost}
                disabled={!inputText.trim()}
                className="py-2 px-3 rounded-[8px] bg-black text-white disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-neutral-700 transition hover:bg-blue-600 active:scale-95"
            >
                发送
            </button>
        </div>
      </div>
      <ConfirmDialog
            isOpen={!!deleteTarget} // 如果 deleteTarget 有值，就显示弹窗
            title="确认删除"
            message="确定要删除这条评论吗？删除后无法恢复。"
            confirmText="确认删除"
            cancelText="取消"
            onConfirm={executeDelete} // 绑定真正的删除逻辑
            onCancel={() => setDeleteTarget(null)} // 点击取消，清空状态（关闭弹窗）
        />
    </div>
  );
}