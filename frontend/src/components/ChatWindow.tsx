// src/components/ChatWindow.tsx
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import api from "@/utils/api";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";

export interface ChatTarget {
  uid: string;
  name: string;
  avatar: string;
}

interface Message {
  id: number;
  senderUid: string;
  receiverUid: string;
  content: string;
  createdAt: string;
}

interface ChatWindowProps {
  target: ChatTarget;
  className?: string; // 允许外部控制高度和样式
  onClose?: () => void; // 仅在移动端或弹窗模式下使用
}

export default function ChatWindow({ target, className }: ChatWindowProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 初始化 & 轮询
  useEffect(() => {
    if (!target.uid) return;

    // 立即加载一次
    fetchHistory(target.uid);
    // 标记已读
    markAsRead(target.uid);

    // 开启轮询 (每3秒)
    const interval = setInterval(() => fetchHistory(target.uid, true), 3000);
    return () => clearInterval(interval);
  }, [target.uid]);

  // 2. 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const markAsRead = (uid: string) => {
    api.post("/social/message/read", null, { params: { targetUid: uid } }).catch(() => {});
  };

  const fetchHistory = async (otherUid: string, isPolling = false) => {
    try {
      const res = await api.get("/social/message/history", {
        params: { otherUid, page: 0, size: 50 }
      });
      const newMsgs = res.data.data?.content || [];
      // 简单的去重判断（防止轮询时UI闪烁，这里简单判断长度或ID）
      setMessages(newMsgs.reverse());
    } catch (err) {
      if (!isPolling) console.error(err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const content = inputText;
    setInputText("");
    setSending(true);

    try {
      await api.post("/social/message", null, {
        params: { toUid: target.uid, content }
      });
      await fetchHistory(target.uid);
    } catch (err) {
      console.error("发送失败", err);
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("flex flex-col bg-white dark:bg-neutral-900 overflow-hidden", className)}>
      {/* 头部 */}
      <div className="h-16 px-6 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900 z-10">
        <div className="flex items-center gap-3">
          <UserAvatar avatar={target.avatar} uid={target.uid} size="w-10 h-10" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{target.name}</h3>
          </div>
        </div>
        
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50 dark:bg-neutral-900/50 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-neutral-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <MessageSquare size={48} className="mb-2" />
            <p>开始聊天吧</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUid === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <UserAvatar avatar={target.avatar} uid={target.uid} size="w-8 h-8 mr-2" />
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-neutral-700 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3 bg-gray-100 dark:bg-neutral-800 rounded-full px-4 py-2 transition-all focus-within:ring-1 focus-within:ring-blue-500/50">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`发消息...`}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}