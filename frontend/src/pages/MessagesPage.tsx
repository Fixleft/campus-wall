import { useState, useEffect } from "react";
import { Check, X, User, Bell, Heart, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { formatRelativeTime } from "@/utils/dateUtils";
import ChatWindow from "@/components/ChatWindow";
import type { ChatTarget } from "@/components/ChatWindow";
import UserAvatar from "@/components/UserAvatar";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Alert, AlertDescription } from '@/components/ui/alert';

// --- 接口定义 ---

interface FriendRequest {
  id: number;
  uid: string;
  name: string;
  avatar: string;
  createdAt: string;
}

interface Conversation {
  targetUid: string;
  targetName: string;
  targetAvatar: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isSystem?: boolean; // 标记是否为系统通知会话
}

// 系统通知接口
interface SystemNotification {
  id: number;
  senderUid: string;
  senderName?: string;
  senderAvatar?: string;
  type: 'LIKE_POST' | 'LIKE_COMMENT' | 'COMMENT_POST' | 'REPLY_COMMENT';
  content?: string;
  postId?: number;
  createdAt: string;
  isRead: boolean;
}

const SYSTEM_NOTIFICATION_UID = "sys_interaction_notify";

// --- 组件部分 ---

const RequestItem = ({ req, onHandle }: { req: FriendRequest; onHandle: (id: number, accept: boolean) => void }) => {
  const [handling, setHandling] = useState(false);
  const handleAction = async (accept: boolean) => {
    setHandling(true);
    await onHandle(req.id, accept);
    setHandling(false);
  };
  return (
    <motion.div 
      layout initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="flex items-center justify-between bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-neutral-700 mb-2"
    >
      <div className="flex items-center gap-3">
        <UserAvatar avatar={req.avatar} uid={req.uid} size="w-10 h-10" />
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{req.name || `用户 ${req.uid}`}</p>
          <p className="text-xs text-gray-500">请求添加你为好友</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => handleAction(false)} disabled={handling} className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors"><X size={16} /></button>
        <button onClick={() => handleAction(true)} disabled={handling} className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"><Check size={16} /></button>
      </div>
    </motion.div>
  );
};

// 新增：右侧系统通知列表组件 (保持 ChatWindow 风格)
const NotificationList = ({ notifications, onClear }: { notifications: SystemNotification[], onClear: () => void }) => {
  return (
      <div className="flex flex-col h-full bg-white dark:bg-neutral-900">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 z-10">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell size={18} /> 互动消息
              </h3>
              {notifications.some(n => !n.isRead) && (
                  <button onClick={onClear} className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                      全部已读
                  </button>
              )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <Bell size={48} className="opacity-20 mb-4"/>
                      <p className="text-sm">暂无互动消息</p>
                  </div>
              ) : (
                  notifications.map(notif => (
                      <div key={notif.id} className={`flex gap-3 items-start p-3 rounded-xl border transition-colors ${notif.isRead ? 'bg-white border-transparent dark:bg-neutral-900' : 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'}`}>
                           <UserAvatar uid={notif.senderUid} avatar={notif.senderAvatar || ""} size="w-10 h-10" />
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline">
                                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                      {notif.senderName || `用户 ${notif.senderUid}`}
                                  </span>
                                  <span className="text-xs text-gray-400 shrink-0 ml-2">{formatRelativeTime(notif.createdAt)}</span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-start gap-1.5">
                                  {/* 根据类型显示不同图标 */}
                                  {(notif.type === 'LIKE_POST' || notif.type === 'LIKE_COMMENT') && (
                                      <Heart size={16} className="text-red-500 fill-red-500 shrink-0 mt-0.5"/>
                                  )}
                                  {(notif.type === 'COMMENT_POST' || notif.type === 'REPLY_COMMENT') && (
                                      <MessageSquare size={16} className="text-blue-500 shrink-0 mt-0.5"/>
                                  )}
                                  
                                  <p className="break-all">
                                    {(notif.type === 'LIKE_POST' || notif.type === 'LIKE_COMMENT') ? (
                                        <span>赞了你的{notif.type === 'LIKE_POST' ? '帖子' : '评论'}</span>
                                    ) : (
                                        <span>
                                            {notif.type === 'COMMENT_POST' ? '评论了你的帖子' : '回复了你'}
                                            {notif.content && <span className="text-gray-500 dark:text-gray-400"> : "{notif.content}"</span>}
                                        </span>
                                    )}
                                  </p>
                              </div>
                           </div>
                           {!notif.isRead && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2"></div>}
                      </div>
                  ))
              )}
          </div>
      </div>
  )
}

export default function MessagesPage() {
  // 状态管理
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<ChatTarget | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setErrorMsg] = useState("");
  // 系统通知相关状态
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [sysNotifUnreadCount, setSysNotifUnreadCount] = useState(0);
  const [lastSysNotif, setLastSysNotif] = useState<SystemNotification | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchConversations();
    fetchSystemNotifications();
    
    // 轮询保持数据新鲜
    const interval = setInterval(() => {
        fetchConversations();
        fetchSystemNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setErrorMsg(""); 
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]); 

  // --- API 调用 ---

  const fetchRequests = async () => {
    try {
      const res = await api.get("/social/friend/requests");
      setRequests(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleRequest = async (id: number, accept: boolean) => {
    try {
      const url = accept ? `/social/friend/accept/${id}` : `/social/friend/reject/${id}`;
      await api.post(url);
      setRequests(prev => prev.filter(r => r.id !== id));
      if (accept) fetchConversations();
    } catch (err) { setErrorMsg("操作失败"); }
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get("/social/message/conversations");
      setConversations(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  // 获取系统通知
  const fetchSystemNotifications = async () => {
      try {
          const res = await api.get("/notifications"); 
          const list = res.data.data || [];
          setSystemNotifications(list);
          
          const unread = list.filter((n: SystemNotification) => !n.isRead).length;
          setSysNotifUnreadCount(unread);
          if (list.length > 0) setLastSysNotif(list[0]);
      } catch (err) { console.error(err); }
  }

  // 标记系统通知已读
  const handleClearSysUnread = async () => {
      try {
          await api.post("/notifications/read-all");
          setSystemNotifications(prev => prev.map(n => ({...n, isRead: true})));
          setSysNotifUnreadCount(0);
      } catch (e) {}
  }

  // 生成展示用的会话列表 (合并系统通知)
  const displayConversations = [...conversations];
  
  // 如果有系统通知（或为了占位），插入到列表顶部
  if (lastSysNotif || sysNotifUnreadCount > 0) {
      const sysConv: Conversation = {
          targetUid: SYSTEM_NOTIFICATION_UID,
          targetName: "互动消息",
          targetAvatar: "SYSTEM_BELL_ICON", // 特殊标记
          lastMessage: getSysMsgPreview(lastSysNotif),
          lastTime: lastSysNotif?.createdAt || new Date().toISOString(),
          unreadCount: sysNotifUnreadCount,
          isSystem: true
      };
      displayConversations.unshift(sysConv);
  }

  function getSysMsgPreview(n: SystemNotification | null) {
      if (!n) return "查看互动消息";
      const who = n.senderName || "有人";
      if (n.type.includes('LIKE')) return `${who} 赞了你`;
      return `${who}: ${n.content || '发来一条评论'}`;
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedTarget({
        uid: conv.targetUid,
        name: conv.targetName,
        avatar: conv.targetAvatar
    });

    if (conv.isSystem) {
    } else {
        // 本地乐观消除私信红点
        setConversations(prev => prev.map(c => 
            c.targetUid === conv.targetUid ? { ...c, unreadCount: 0 } : c
        ));
    }
  };


  const executeClearHistory = async () => {
      if (!selectedTarget) return;

     

      try {
          // 调用后端清空接口 (假设接口路径如下，根据你实际 Controller 配置调整)
          await api.delete(`/social/conversations/${selectedTarget.uid}`);
          
          
          setRefreshKey(prev => prev + 1);
          setIsClearDialogOpen(false); 
      } catch (error) {
          console.error("清空失败", error);
          setErrorMsg("清空失败，请重试"); 
      }
  };
  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 dark:bg-neutral-950 flex flex-col max-w-[1600px] mx-auto w-full">
       <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 left-4 right-4 z-50"
                  >
                    <Alert variant="destructive" className="rounded-lg bg-zinc-900 border border-red-900 text-red-500 shadow-xl py-2">
                      <AlertDescription className="text-center text-sm">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
      </AnimatePresence>
      {/* 好友申请 */}
      <AnimatePresence>
        {requests.length > 0 && (
          <div className="px-4 pt-4 sm:px-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">好友申请 ({requests.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {requests.map(req => (<RequestItem key={req.id} req={req} onHandle={handleRequest} />))}
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden p-4 sm:p-6 flex gap-6">
        
        {/* === 左侧会话列表 === */}
        <div className={`w-full md:w-80 flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden ${selectedTarget ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">消息列表</h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-full">{displayConversations.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {displayConversations.map(conv => (
              <div 
                key={conv.targetUid}
                onClick={() => handleSelectConversation(conv)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group ${
                  selectedTarget?.uid === conv.targetUid 
                    ? "bg-blue-50 dark:bg-blue-900/20" 
                    : "hover:bg-gray-50 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="relative shrink-0">
                  {conv.isSystem ? (
                      // 系统通知的特殊图标
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Bell size={24} />
                      </div>
                  ) : (
                      <UserAvatar avatar={conv.targetAvatar} uid={conv.targetUid} size="w-12 h-12" />
                  )}
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center px-1 border-2 border-white dark:border-neutral-900 shadow-sm animate-pulse">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-semibold truncate text-sm ${selectedTarget?.uid === conv.targetUid ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"}`}>
                      {conv.targetName}
                    </h3>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatRelativeTime(conv.lastTime)}</span>
                  </div>
                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-gray-800 dark:text-gray-200 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                    {conv.lastMessage || "暂无消息"}
                  </p>
                </div>
              </div>
            ))}
            {displayConversations.length === 0 && (
               <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                 <p className="text-sm">暂无消息</p>
               </div>
            )}
          </div>
        </div>

        {/* === 右侧详情窗口 === */}
        <div className={`flex-1 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col overflow-hidden ${!selectedTarget ? 'hidden md:flex' : 'flex'}`}>
          {selectedTarget ? (
             <div className="relative h-full flex flex-col">
                <button onClick={() => setSelectedTarget(null)} className="md:hidden absolute top-4 left-2 z-50 p-2 text-gray-500 hover:text-gray-900"><X size={20}/></button>
                
                {selectedTarget.uid === SYSTEM_NOTIFICATION_UID ? (
                    // 显示系统通知列表
                    <NotificationList notifications={systemNotifications} onClear={handleClearSysUnread} />
                ) : (
                                        <>
                        {/* 2. 【新增】清空聊天记录按钮 (绝对定位到右上角) */}
                        <button 
                            onClick={() => setIsClearDialogOpen(true)}
                            title="清空聊天记录"
                            className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors bg-white/50 dark:bg-black/50 backdrop-blur-sm"
                        >
                            <Trash2 size={18} />
                        </button>

                        {/* 显示聊天窗口 */}
                        <ChatWindow 
                            key={ `${selectedTarget.uid}-${refreshKey}`} // 如果想清空后自动刷新，可以将 key 修改为 `${selectedTarget.uid}-${refreshKey}`
                            target={selectedTarget} 
                            className="h-full" 
                        />
                    </>

                )}
             </div>
          ) : (
            <div className="hidden md:flex h-full flex-col items-center justify-center text-gray-400">
              <div className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <User size={48} className="opacity-20" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">消息中心</h3>
              <p className="max-w-xs text-center text-sm text-gray-500">在左侧列表中选择，开始查看消息吧！</p>
            </div>
          )}
        </div>
      </div>
       <ConfirmDialog
        isOpen={isClearDialogOpen}
        title="清空聊天记录"
        message={
            <span>
              确定要清空与 <span className="font-bold text-white">{selectedTarget?.name}</span> 的所有聊天记录吗？
              <br/>
              <span className="text-red-500 text-xs mt-2 block">此操作不可撤销</span>
            </span>
        }
        confirmText="确认清空"
        cancelText="再想想"
        onConfirm={executeClearHistory}
        onCancel={() => setIsClearDialogOpen(false)}
      />
    </div>
  );
}