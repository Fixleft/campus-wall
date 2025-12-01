import { FileUpload } from "@/components/ui/file-upload";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAddress } from "@/utils/location";
import api from "@/utils/api";
// 1. 导入 Shadcn Alert 组件和图标
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function PostUploadCard({
  isOpen,
  handleClick,
}: {
  isOpen: boolean;
  handleClick: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [address, setAddress] = useState("获取位置中...");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  // 2. 新增状态用于控制 Alert 显示
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("浏览器不支持地理位置"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    });
  }

  useEffect(() => {
    if (isOpen) {
      // 每次打开时重新获取或重置逻辑可放在这里，目前保持原样仅组件挂载时获取
      getCurrentLocation()
        .then(({ latitude, longitude }) => getAddress(latitude, longitude))
        .then((addr) => setAddress(addr))
        .catch(() => setAddress("无法获取位置"));
    }
  }, [isOpen]);

  // 当 Alert 显示时，3秒后自动消失（如果是成功状态则配合关闭弹窗）
  useEffect(() => {
    if (status.type) {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  function handleUpload(files: File[]) {
    setFiles(files);
  }
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  function handleAnonymousChange(event: React.ChangeEvent<HTMLInputElement>) {
    setIsAnonymous(event.target.checked);
  }

  // 3. 改进：严格判断是否可发布
  // 只要内容(文本)不为空，或者有文件，即可发布。
  // 移除了 tags.length > 0 和 address.length > 0 的判断，防止只有地址或标签时误触发布
  const canPost = content.trim().length > 0 || files.length > 0;

 const handlePost = async () => {
    if (!canPost || uploading) return;

    setUploading(true);
    setStatus({ type: null, message: '' }); // 清除旧消息

    try {
      // Step 1: 上传文件
      const mediaUrls: string[] = [];

      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await api.post<string>("/files/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return res.data;
        });

        const urls = await Promise.all(uploadPromises);
        mediaUrls.push(...urls);
      }

      // Step 2: 准备地址数据
      // 修复：强制将 address 转为字符串，避免 "finalLocation.trim is not a function" 报错
      let finalLocation = String(address || ""); 
      
      // 检查无效地址
      if (
        !finalLocation || 
        finalLocation.trim() === "" || 
        finalLocation === "获取位置中..." || 
        finalLocation === "无法获取位置"
      ) {
        finalLocation = "未知";
      }

      // Step 3: 提交帖子
      await api.post("/posts/upload", {
        content: content.trim() || null, // 如果内容为空字符串，传 null
        location: finalLocation,
        isAnonymous,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
        tags: tags.length > 0 ? tags : null,
      });

      // Step 4: 发表成功处理
      setStatus({ type: 'success', message: '发表成功！' });

      // 延迟关闭
      setTimeout(() => {
        setContent("");
        setFiles([]);
        setTags([]);
        setTagInput("");
        setIsAnonymous(false);
        // 重置地址状态，可选
        // setAddress("获取位置中..."); 
        setStatus({ type: null, message: '' });
        handleClick(); // 关闭弹窗
      }, 1000);

    } catch (err: any) {
      console.error("发表失败:", err);
      let msg = "发表失败，请重试";
      if (err.response?.status !== 401) {
         msg = err.response?.data?.message || err.message || msg;
      }
      setStatus({ type: 'error', message: msg });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) {
    return null;
  }
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative flex flex-row items-center p-8 bg-white rounded-xl shadow-2xl w-[800px] h-[500px] overflow-hidden text-neutral-400 dark:text-neutral-400">
          
          {/* 5. 插入 Alert 组件：使用绝对定位浮在顶部，不影响原有布局 */}
          <AnimatePresence>
            {status.type && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-8 right-36 z-50" // right-36 为了避开“发布”按钮
              >
                <Alert variant={status.type === 'error' ? "destructive" : "default"} className={`${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : ''} shadow-md`}>
                  {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  <AlertTitle>{status.type === 'error' ? "错误" : "成功"}</AlertTitle>
                  <AlertDescription>
                    {status.message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col w-full mb-4 gap-2">
            {/* 发表按钮 */}
            <button
              onClick={handlePost}
              disabled={!canPost || uploading}
              className={`
                absolute top-6 right-8 px-4 py-1.5 rounded-[8px] font-medium text-[18px]
                transition-all duration-200 z-50
                ${canPost && !uploading
                  ? "text-white bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl"
                  : "text-gray-400 bg-gray-200 cursor-not-allowed"
                }
              `}
            >
              {uploading ? "发布中..." : "发表"}
            </button>
            {/* 内容输入 */}
            <textarea
              placeholder="这一刻的想法..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-40 p-4 text-black focus:outline-none resize-none"
            />
            <div className="mt-3 h-26 flex flex-wrap gap-2 
                  overflow-y-auto overflow-x-hidden     
                  py-2 bg-white 
                  scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                  hover:scrollbar-thumb-gray-500">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-[#002456] flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                    fill="currentColor"
                    className="w-4 h-4 shirk-0 items-center justify-center"
                  >
                    <path d="M278.7 64.7C296 68.4 307 85.4 303.3 102.7L284.2 192L410.7 192L432.7 89.3C436.4 72 453.4 61 470.7 64.7C488 68.4 499 85.4 495.3 102.7L476.2 192L544 192C561.7 192 576 206.3 576 224C576 241.7 561.7 256 544 256L462.4 256L435 384L502.8 384C520.5 384 534.8 398.3 534.8 416C534.8 433.7 520.5 448 502.8 448L421.2 448L399.2 550.7C395.5 568 378.5 579 361.2 575.3C343.9 571.6 332.9 554.6 336.6 537.3L355.7 448L229.2 448L207.2 550.7C203.5 568 186.5 579 169.2 575.3C151.9 571.6 140.9 554.6 144.6 537.3L163.8 448L96 448C78.3 448 64 433.7 64 416C64 398.3 78.3 384 96 384L177.6 384L205 256L137.2 256C119.5 256 105.2 241.7 105.2 224C105.2 206.3 119.5 192 137.2 192L218.8 192L240.8 89.3C244.4 72 261.4 61 278.7 64.7zM270.4 256L243 384L369.5 384L396.9 256L270.4 256z" />
                  </svg>
                  <span>
                    {tag}
                  </span>

                </button>
              ))}
            </div>
            <div className="flex flex-row items-center gap-1 mt-5">
              {/* 标签输入 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                fill="currentColor"
                className="w-7 h-7 shirk-0"
              >
                <path d="M278.7 64.7C296 68.4 307 85.4 303.3 102.7L284.2 192L410.7 192L432.7 89.3C436.4 72 453.4 61 470.7 64.7C488 68.4 499 85.4 495.3 102.7L476.2 192L544 192C561.7 192 576 206.3 576 224C576 241.7 561.7 256 544 256L462.4 256L435 384L502.8 384C520.5 384 534.8 398.3 534.8 416C534.8 433.7 520.5 448 502.8 448L421.2 448L399.2 550.7C395.5 568 378.5 579 361.2 575.3C343.9 571.6 332.9 554.6 336.6 537.3L355.7 448L229.2 448L207.2 550.7C203.5 568 186.5 579 169.2 575.3C151.9 571.6 140.9 554.6 144.6 537.3L163.8 448L96 448C78.3 448 64 433.7 64 416C64 398.3 78.3 384 96 384L177.6 384L205 256L137.2 256C119.5 256 105.2 241.7 105.2 224C105.2 206.3 119.5 192 137.2 192L218.8 192L240.8 89.3C244.4 72 261.4 61 278.7 64.7zM270.4 256L243 384L369.5 384L396.9 256L270.4 256z" />
              </svg>
              <input
                type="text"
                placeholder="Enter添加话题,点击取消"
                value={tagInput}
                onChange={handleTagChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // 防止表单提交或换行
                    handleAddTag();
                  }
                }}
                className="w-full ml-4 border-none focus:outline-none"
              />
            </div>
            {/* 地址输入 */}
            <div className="flex flex-row items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                fill="currentColor"
                className="w-7 h-7 shirk-0"
              >
                <path d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z" />
              </svg>
              <input
                className="w-full h-10 p-4 focus:outline-none text-neutral-500"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            { /* 是否匿名 */}
            <div className="flex flex-row items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                fill="currentColor"
                className="w-6 h-6 shirk-0"
              >
                <path d="M320 128C96 128 32 224 32 336C32 448 112 512 208 512L216.4 512C240.6 512 262.8 498.3 273.6 476.6L296.8 430.3C301.2 421.5 310.1 416 320 416C329.9 416 338.8 421.5 343.2 430.3L366.4 476.6C377.2 498.3 399.4 512 423.6 512L432 512C528 512 608 448 608 336C608 224 544 128 320 128zM128 320C128 284.7 156.7 256 192 256C227.3 256 256 284.7 256 320C256 355.3 227.3 384 192 384C156.7 384 128 355.3 128 320zM448 256C483.3 256 512 284.7 512 320C512 355.3 483.3 384 448 384C412.7 384 384 355.3 384 320C384 284.7 412.7 256 448 256z" />
              </svg>
              <label htmlFor="anonymous" className="ml-4 text-neutral-500">
                匿名
              </label>
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={handleAnonymousChange}
                className="mr-1 w-4 h-4"
              />
            </div>

          </div>
          <FileUpload onChange={handleUpload} />
        </div>
      </motion.div>

    </>
  );
}