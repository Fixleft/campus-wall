// src/components/ChatModal.tsx
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ChatWindow from "./ChatWindow";
import type { ChatTarget } from "./ChatWindow";
interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ChatTarget | null;
}

export default function ChatModal({ isOpen, onClose, target }: ChatModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && target && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          
          {/* 弹窗主体 */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="pointer-events-auto w-full max-w-[800px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 relative"
            >
                {/* 关闭按钮 (绝对定位在 ChatWindow 之上) */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-1.5 bg-gray-100/50 dark:bg-neutral-800/50 hover:bg-red-100 hover:text-red-500 rounded-full text-gray-500 transition-colors backdrop-blur-md"
                >
                    <X size={18} />
                </button>

                {/* 嵌入聊天窗口，设置固定高度 */}
                <ChatWindow 
                    target={target} 
                    className="h-[600px] max-h-[80vh]" 
                />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}