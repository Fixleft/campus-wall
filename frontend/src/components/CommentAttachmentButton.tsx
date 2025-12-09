import { cn } from "@/lib/utils";
// 1. 引入 forwardRef, useImperativeHandle
import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconX } from "@tabler/icons-react";
import { useUser } from "@/context/UserContext";
import AuthDialog from "./AuthDialog";

interface CommentAttachmentBtnProps {
  onChange?: (files: File[]) => void;
  maxFiles?: number;
}

// 2. 定义暴露给父组件的方法类型
export interface CommentAttachmentRef {
  clear: () => void;
}

// 3. 使用 forwardRef 包裹组件
export const CommentAttachmentButton = forwardRef<CommentAttachmentRef, CommentAttachmentBtnProps>(
  ({ onChange, maxFiles = 1 }, ref) => {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loginCardOpen, setLoginCardOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useUser();
    // 4. 暴露 clear 方法给父组件
    useImperativeHandle(ref, () => ({
      clear: () => {
        // 清空状态
        setFiles([]);
        
        // 撤销所有 ObjectURL，防止内存泄漏
        previews.forEach((url) => URL.revokeObjectURL(url));
        setPreviews([]);
        
        // 重置 input value，允许再次选择同一个文件
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      if (newFiles.length) {
        const updatedFiles = maxFiles === 1 ? [newFiles[0]] : [...files, ...newFiles].slice(0, maxFiles);
        setFiles(updatedFiles);
        onChange?.(updatedFiles);

        const newPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
        setPreviews(newPreviews);
      }
    };

    const handleRemoveFile = (indexToRemove: number) => {
      const updatedFiles = files.filter((_, index) => index !== indexToRemove);
      setFiles(updatedFiles);
      onChange?.(updatedFiles);

      URL.revokeObjectURL(previews[indexToRemove]);
      setPreviews(previews.filter((_, index) => index !== indexToRemove));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    useEffect(() => {
      return () => {
        previews.forEach((url) => URL.revokeObjectURL(url));
      };
    }, []); 
    const handleClick = () => {
      if (!user) {
            setLoginCardOpen(true);
            return;
        }
      fileInputRef.current?.click();
    };

    return (
      <>
       {loginCardOpen && (
                          <AuthDialog
                            isOpen={loginCardOpen}
                            onClose={() => setLoginCardOpen(false)}
                          />
                        )}
      <div className="relative flex items-center justify-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="absolute bottom-full mb-3 flex gap-2 z-50">
          <AnimatePresence>
            {files.map((file, idx) => (
              <motion.div
                key={file.name + file.lastModified}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="relative group"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700 shadow-lg bg-white dark:bg-neutral-800 relative flex items-center justify-center">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={previews[idx]}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={previews[idx]}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                  <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(idx);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-50"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={handleClick}
          type="button"
          className={cn(
            "p-2 rounded-full transition-colors",
            files.length > 0
              ? "bg-blue-50 border-blue-500 text-blue-500"
              : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 border-gray-300"
          )}
          title="上传图片或视频"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            className="w-5 h-5 shrink-0 fill-current"
          >
            <path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z" />
          </svg>
        </button>
      </div>
        </>
    );
  }
  
);

CommentAttachmentButton.displayName = "CommentAttachmentButton";