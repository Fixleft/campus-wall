// src/pages/FriendsPage.tsx
import { useState, useEffect } from "react";
import { MessageCircle, UserX, Search, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import ChatModal from "@/components/ChatModal"; // 引入新组件
import type { ChatTarget } from "@/components/ChatWindow";
import UserAvatar from "@/components/UserAvatar";
import ConfirmDialog from "@/components/ConfirmDialog";

type DeleteTarget = { friendUid: string, friendName: string } | null;

interface Friend {
  uid: string;
  name: string;
  avatar: string;
  signature: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatTarget, setCurrentChatTarget] = useState<ChatTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const handleMessage = (friend: any) => {
    setCurrentChatTarget({
        uid: friend.uid,
        name: friend.name,
        avatar: friend.avatar
    });
    setIsChatOpen(true);
  };
  // 获取好友列表
  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await api.get("/social/friend/list");
      setFriends(res.data.data || []);
    } catch (err) {
      console.error("获取好友列表失败", err);
    } finally {
      setLoading(false);
    }
  };

  
const openDeleteConfirm = (friendUid: string, friendName: string) => {
    
    setDeleteTarget({ friendUid, friendName });
};

  // 删除好友
  const executeDelete = async () => {
   
    if (!deleteTarget) return;

   
    const { friendUid } = deleteTarget;

  
    setFriends((prev) => prev.filter((f) => f.uid !== friendUid));

  
    setDeleteTarget(null);

    try {
     
      await api.delete(`/social/friend/${friendUid}`);
    } catch (err) {
      console.error("删除失败", err);
      fetchFriends(); 
    }
  };

  

  // 简单的本地搜索过滤
  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.uid.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* 头部标题 & 统计 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              我的好友
              <span className="text-sm font-normal text-gray-500 bg-gray-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                {friends.length}
              </span>
            </h1>
            
          </div>

          {/* 搜索框 */}
          <div className="relative w-full sm:w-64">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={16} />
             </div>
             <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索好友昵称或UID..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
             />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="space-y-4">
          {loading ? (
             // Loading 骨架屏
             Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-white dark:bg-neutral-900 rounded-xl animate-pulse" />
             ))
          ) : filteredFriends.length > 0 ? (
            <AnimatePresence>
              {filteredFriends.map((friend) => (
                <motion.div
                  key={friend.uid}
                  layout // 布局动画，删除时其他卡片会自动补位
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
                >
                  {/* 左侧：信息 */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <UserAvatar 
                        avatar={friend.avatar} 
                        uid={friend.uid} 
                        size="w-16 h-16" 
                      />
                     
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                         <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                            {friend.name}
                         </h3>
                         <span className="text-xs font-mono text-gray-400">#{friend.uid}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {friend.signature || "这个人很懒，什么都没写"}
                      </p>
                    </div>
                  </div>

                  {/* 右侧：操作按钮 */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* 私信按钮 */}
                    <button
                      onClick={() => handleMessage(friend)}
                      className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      title="发送私信"
                    >
                      <MessageCircle size={20} />
                    </button>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => openDeleteConfirm(friend.uid, friend.name)}
                      className="p-2.5 rounded-lg bg-gray-50 text-gray-400 dark:bg-neutral-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-500 transition-colors"
                      title="删除好友"
                    >
                      <UserX size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            // 空状态
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                 <User size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                 {searchQuery ? "未找到匹配的好友" : "暂无好友"}
              </h3>
              <p className="text-gray-500 text-sm mt-2 max-w-xs">
                 {searchQuery ? "换个关键词试试看？" : "去广场看看，认识一些新朋友吧！"}
              </p>
            </div>
          )}
        </div>
      </div>
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        target={currentChatTarget} 
      />
      <ConfirmDialog
                  isOpen={!!deleteTarget} // 如果 deleteTarget 有值，就显示弹窗
                  title="确认删除"
                  message="确定要删除这个好友吗？删除后无法恢复。"
                  confirmText="确认删除"
                  cancelText="取消"
                  onConfirm={executeDelete} 
                  onCancel={() => setDeleteTarget(null)} 
              />
    </div>
  );
}