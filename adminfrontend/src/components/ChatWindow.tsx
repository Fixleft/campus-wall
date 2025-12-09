// src/components/ChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { adminApi } from '@/api/admin';
import type { PrivateMessage } from '@/api/admin';

// 获取当前管理员信息
const getAdminInfo = () => JSON.parse(localStorage.getItem('ADMIN_INFO') || '{}');

// 定义聊天对象类型
export interface ChatTarget {
  uid: string;
  name: string;
  avatar: string;
}

interface ChatWindowProps {
  target: ChatTarget;
  className?: string; // 接收外部传入的样式
}

export default function ChatWindow({ target, className }: ChatWindowProps) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const admin = getAdminInfo();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  };
  
  useEffect(() => { scrollToBottom(); }, [messages]);

  // 获取历史消息
  useEffect(() => {
    if (!target.uid) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await adminApi.getMessageHistory(target.uid);
        setMessages(res.data.content || []); 
      } catch (error) {
        console.error("获取历史消息失败:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [target.uid]);

  // 发送消息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const tempMessage: PrivateMessage = {
      id: Date.now(),
      content: newMessage,
      senderUid: admin.uid,
      recipientUid: target.uid,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      await adminApi.sendPrivateMessage({
        recipientUid: target.uid,
        content: tempMessage.content,
      });
    } catch (error) {
      alert('消息发送失败');
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  return (
    // 【修改】使用 div 包裹，并应用传入的 className
    <div className={`w-full bg-white dark:bg-neutral-900 flex flex-col ${className || ''}`}>
      {/* 头部 */}
      <header className="flex items-center p-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        <img src={target.avatar} className="w-10 h-10 rounded-full mr-3" />
        <div>
          <p className="font-bold dark:text-white">与 {target.name} 的对话</p>
          <p className="text-xs text-neutral-500">UID: {target.uid}</p>
        </div>
      </header>

      {/* 消息列表 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-neutral-400" /></div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.senderUid === admin.uid ? 'justify-end' : 'justify-start'}`}>
              {msg.senderUid !== admin.uid && <img src={target.avatar} className="w-6 h-6 rounded-full" />}
              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${msg.senderUid === admin.uid ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-neutral-100 dark:bg-neutral-800'}`}>{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 shrink-0">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="输入消息..." className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full border-none outline-none focus:ring-2 focus:ring-black" />
        <button type="submit" disabled={sending} className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-50"><Send size={18} /></button>
      </form>
    </div>
  );
}