// components/UserAvatar.tsx
import { useState } from "react";
import UserProfileModal from "@/components/UserProfileModal"; // 引入之前的弹窗组件
import api from "@/utils/api"; // 假设这是你的 axios 实例，根据实际路径修改

// 定义接口
interface UserAvatarProps {
  avatar: string;        // 头像 URL
  uid: string;  // 用户 ID
  size?: string;         // 尺寸样式，例如 "w-10 h-10" 或 "w-[50px] h-[50px]"
  className?: string;    // 额外的样式类
}

export default function UserAvatar({ avatar, uid, size = "w-10 h-10", className = "" }: UserAvatarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // 点击头像的处理逻辑
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止冒泡（比如在卡片里点击头像触发卡片点击）
    
    // 如果已经有数据了，直接打开，不再重复请求（可选优化）
    if (userInfo) {
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    try {
     
      const response = await api.get(`/users/info/${uid}`);
      
      setUserInfo(response.data); 
      
      setIsModalOpen(true);
    } catch (error) {
      console.error("获取用户信息失败", error);
      // 这里可以加一个 Toast 提示，例如: toast.error("获取用户信息失败")
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
      <div 
        className={`relative inline-block shrink-0 cursor-pointer transition-opacity hover:opacity-80 ${size} ${className}`}
        onClick={handleClick}
      >
        <img
          src={avatar || "default_avatar.png"} 
          alt={`User ${uid}`}
          className="w-full h-full rounded-full object-cover border border-black/10 dark:border-white/10"
        />
        
        {/* 可选：加载时的 loading 圈 */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <div className="w-1/2 h-1/2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

    
      <UserProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userInfo={userInfo} 
      />
    </>
  );
}