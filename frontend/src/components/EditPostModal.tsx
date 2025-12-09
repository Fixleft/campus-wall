import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // 初始化数据
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setTags(initialTags || []);
      setTagInput("");
      setStatus({ type: null, message: '' });
    }
  }, [isOpen, initialContent, initialTags]);

  // Alert 自动消失
  useEffect(() => {
    if (status.type) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = () => {
    const trimmedInput = tagInput.trim();
    if (trimmedInput && !tags.includes(trimmedInput)) {
      setTags([...tags, trimmedInput]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // 严格校验：内容不能为空
  const canSave = content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSave || isSubmitting) return;

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      await api.put(`/posts/${postId}`, {
        content: content.trim(),
        tags: tags,
      });

      setStatus({ type: 'success', message: '更新成功！' });
      
      // 延迟关闭以显示成功提示
      setTimeout(() => {
        onSuccess(content.trim(), tags);
        onClose();
      }, 1000);

    } catch (error: any) {
      console.error("更新失败", error);
      let msg = "更新失败，请重试";
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      setStatus({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
        onClick={onClose}
      />
      
      {/* 模态框主体 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="relative flex flex-col p-8 bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden text-neutral-400 pointer-events-auto">
          
          {/* 状态提示 Alert */}
          <AnimatePresence>
            {status.type && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-8 right-36 z-50"
              >
                <Alert variant={status.type === 'error' ? "destructive" : "default"} className={`${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : ''} shadow-md py-2`}>
                  {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  <AlertTitle className="text-sm font-bold">{status.type === 'error' ? "错误" : "成功"}</AlertTitle>
                  <AlertDescription className="text-xs">
                    {status.message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 关闭按钮 (左上角，类似 PostUploadCard 风格虽未显示但为了 UX 添加) */}
          <button 
            onClick={onClose} 
            className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
             <X className="w-6 h-6 text-gray-400" />
          </button>

          {/* 保存按钮 (右上角) */}
          <button
            onClick={handleSubmit}
            disabled={!canSave || isSubmitting}
            className={`
              absolute top-6 right-8 px-4 py-1.5 rounded-[8px] font-medium text-[18px]
              transition-all duration-200 z-50
              ${canSave && !isSubmitting
                ? "text-white bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
              }
            `}
          >
            {isSubmitting ? "保存中..." : "保存"}
          </button>

          {/* 内容输入区域 */}
          <div className="flex flex-col w-full mt-8 gap-2">
            <textarea
              placeholder="修改这一刻的想法..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-40 p-4 text-black focus:outline-none resize-none text-lg"
            />
            
            {/* 标签展示区域 */}
            <div className="mt-1 h-auto min-h-[40px] max-h-[100px] flex flex-wrap gap-2 
                  overflow-y-auto overflow-x-hidden     
                  py-2 bg-white 
                  scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-[#002456] flex items-center hover:opacity-70 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                    fill="currentColor"
                    className="w-4 h-4 shirk-0 mr-1"
                  >
                    <path d="M278.7 64.7C296 68.4 307 85.4 303.3 102.7L284.2 192L410.7 192L432.7 89.3C436.4 72 453.4 61 470.7 64.7C488 68.4 499 85.4 495.3 102.7L476.2 192L544 192C561.7 192 576 206.3 576 224C576 241.7 561.7 256 544 256L462.4 256L435 384L502.8 384C520.5 384 534.8 398.3 534.8 416C534.8 433.7 520.5 448 502.8 448L421.2 448L399.2 550.7C395.5 568 378.5 579 361.2 575.3C343.9 571.6 332.9 554.6 336.6 537.3L355.7 448L229.2 448L207.2 550.7C203.5 568 186.5 579 169.2 575.3C151.9 571.6 140.9 554.6 144.6 537.3L163.8 448L96 448C78.3 448 64 433.7 64 416C64 398.3 78.3 384 96 384L177.6 384L205 256L137.2 256C119.5 256 105.2 241.7 105.2 224C105.2 206.3 119.5 192 137.2 192L218.8 192L240.8 89.3C244.4 72 261.4 61 278.7 64.7zM270.4 256L243 384L369.5 384L396.9 256L270.4 256z" />
                  </svg>
                  <span>{tag}</span>
                </button>
              ))}
            </div>

            {/* 标签输入框 */}
            <div className="flex flex-row items-center gap-1 mt-2 border-t pt-4 border-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                fill="currentColor"
                className="w-6 h-6 shirk-0"
              >
                <path d="M278.7 64.7C296 68.4 307 85.4 303.3 102.7L284.2 192L410.7 192L432.7 89.3C436.4 72 453.4 61 470.7 64.7C488 68.4 499 85.4 495.3 102.7L476.2 192L544 192C561.7 192 576 206.3 576 224C576 241.7 561.7 256 544 256L462.4 256L435 384L502.8 384C520.5 384 534.8 398.3 534.8 416C534.8 433.7 520.5 448 502.8 448L421.2 448L399.2 550.7C395.5 568 378.5 579 361.2 575.3C343.9 571.6 332.9 554.6 336.6 537.3L355.7 448L229.2 448L207.2 550.7C203.5 568 186.5 579 169.2 575.3C151.9 571.6 140.9 554.6 144.6 537.3L163.8 448L96 448C78.3 448 64 433.7 64 416C64 398.3 78.3 384 96 384L177.6 384L205 256L137.2 256C119.5 256 105.2 241.7 105.2 224C105.2 206.3 119.5 192 137.2 192L218.8 192L240.8 89.3C244.4 72 261.4 61 278.7 64.7zM270.4 256L243 384L369.5 384L396.9 256L270.4 256z" />
              </svg>
              <input
                type="text"
                placeholder="Enter添加话题"
                value={tagInput}
                onChange={handleTagChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="w-full ml-4 border-none focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}