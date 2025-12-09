import { useState, useEffect } from "react";
import { UserPlus, Check, Loader2, UserCheck } from "lucide-react";
import api from "@/utils/api"; // 你的 axios 实例
import { useUser } from "@/context/UserContext"; // 获取当前用户信息
import { cn } from "@/lib/utils"; // 如果你有 tailwind-merge，没有的话直接拼接字符串

interface AddFriendButtonProps {
  targetUid: string;
  initialIsFriend?: boolean;
  className?: string;
  variant?: "icon" | "text" | "full"; // icon: 只有图标, text: 图标+文字, full: 宽按钮
  size?: "sm" | "md" | "lg";
  onSuccess?: () => void;
}

export default function AddFriendButton({
  targetUid,
  initialIsFriend = false,
  className,
  variant = "text",
  size = "md",
  onSuccess,
}: AddFriendButtonProps) {
  const { user } = useUser();
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "friend" | "error">(
    initialIsFriend ? "friend" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialIsFriend) setStatus("friend");
  }, [initialIsFriend]);
  // 0.如果是自己，不渲染任何东西
  if (!user || user.uid === targetUid) return null;

const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. 如果已经是好友，点击跳转到私信页面 (可选功能)
    if (status === "friend") {
     
      return;
    }

    // 2. 如果已发送申请，不做操作
    if (status === "sent") return;

    // 3. 发送好友申请逻辑
    setStatus("loading");
    setErrorMsg("");

    try {
      await api.post(`/social/friend/request`, null, {
        params: { targetUid },
      });
      setStatus("sent");
      onSuccess?.();
    } catch (err: any) {
      console.error("申请失败", err);
      // 特殊判断：如果后端返回“已经是好友”，直接更新状态
      const msg = err.response?.data?.message || "";
      if (msg.includes("已经是好友")) {
          setStatus("friend");
      } else {
          setStatus("error");
          setErrorMsg(msg || "失败");
          setTimeout(() => {
            setStatus("idle");
            setErrorMsg("");
          }, 2000);
      }
    }
  };

  // --- 样式配置 ---
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-6 text-base",
  };
  
  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  // 基础样式
  const baseClass = "inline-flex items-center justify-center rounded-full font-medium transition-all focus:outline-none focus:ring-1 focus:ring-offset-1  disabled:opacity-50 disabled:cursor-not-allowed";
  
  // 根据状态计算样式
  let statusClass = "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"; // idle 默认蓝
  
  if (status === "friend") {
    // 好友状态：绿色或灰色，这里用绿色边框风格，表示已连接
    statusClass = "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100";
  } else if (status === "sent") {
    // 已发送：灰色
    statusClass = "bg-gray-100 text-gray-500 border border-gray-200 cursor-default";
  } else if (status === "error") {
    statusClass = "bg-red-50 text-red-600 border border-red-200";
  } else if (status === "loading") {
    statusClass = "bg-blue-600/80 text-white cursor-wait";
  }

  if (variant === "icon") statusClass += " aspect-square px-0 rounded-full";

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading" || status === "sent"} 
      className={cn(baseClass, sizeClasses[size], statusClass, className)}
      title={errorMsg || "添加好友"}
    >
      {/* Loading */}
      {status === "loading" && <Loader2 size={iconSizes[size]} className="animate-spin" />}

      {/* 已是好友 */}
      {status === "friend" && (
        <>
          <UserCheck size={iconSizes[size]} className={variant !== "icon" ? "mr-1.5" : ""} />
          {variant !== "icon" && "好友"} 
        </>
      )}

      {/* 已发送申请 */}
      {status === "sent" && (
        <>
          <Check size={iconSizes[size]} className={variant !== "icon" ? "mr-1.5" : ""} />
          {variant !== "icon" && "已申请"}
        </>
      )}

      {/* 默认状态: 加好友 */}
      {status === "idle" && (
        <>
          <UserPlus size={iconSizes[size]} className={variant !== "icon" ? "mr-1.5" : ""} />
          {variant !== "icon" && "加好友"}
        </>
      )}

      {/* 错误状态 */}
      {status === "error" && (
         <span className="truncate max-w-[6em]">{errorMsg || "重试"}</span>
      )}
    </button>
  );
}