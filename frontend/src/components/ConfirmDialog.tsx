// src/components/ConfirmDialog.tsx
"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title = "确认操作",
  message = "你确定要执行此操作吗？",
  confirmText = "确定",
  cancelText = "取消",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景蒙层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* 弹窗主体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={onCancel}
                  className="text-zinc-500 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容 */}
              <div className="p-6 text-center">
                <p className="text-zinc-300 text-sm leading-relaxed">{message}</p>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={onCancel}
                  className="flex-1 px-5 py-2.5 border border-zinc-700 rounded-xl text-zinc-300 hover:bg-zinc-800 transition"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onCancel(); // 自动关闭弹窗
                  }}
                  className="flex-1 px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}