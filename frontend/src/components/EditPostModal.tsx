import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import api from "@/utils/api";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  initialContent: string;
  initialTags?: string[];
  onSuccess: (newContent: string, newTags: string[]) => void;
}

export default function EditPostModal({
  isOpen,
  onClose,
  postId,
  initialContent,
  initialTags = [],
  onSuccess,
}: EditPostModalProps) {
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string>(initialTags.join(", ")); // 简单处理：用逗号分隔
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);

    try {
      // 处理标签字符串转数组
      const tagArray = tags
        .split(/[,，]/) // 支持中英文逗号
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await api.put(`/posts/${postId}`, {
        content,
        tags: tagArray,
      });

      onSuccess(content, tagArray);
      onClose();
    } catch (error) {
      console.error("更新失败", error);
      alert("更新失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-lg overflow-hidden rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">编辑帖子</h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-neutral-800">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* 内容输入 */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">内容</label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="h-32 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
                        placeholder="写点什么..."
                      />
                    </div>

                    {/* 标签输入 */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">标签 (用逗号分隔)</label>
                      <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
                        placeholder="例如: 校园, 生活, 吐槽"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={onClose}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !content.trim()}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                      保存修改
                    </button>
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