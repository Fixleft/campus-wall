import { useEffect } from 'react';
import UserPostList from '@/components/UserPostList';
import AddFriendButton from './AddFriendButton';

// 定义用户信息接口
interface UserInfo {
  uid: string;
  name: string;
  avatar: string;
  gender?: string;
  age?: number;
  hometown?: string;
  signature?: string;
  friend?: boolean;
  enable: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo: UserInfo | null;
}

export default function UserProfileModal({ isOpen, onClose, userInfo }: UserProfileModalProps) {
    
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen || !userInfo) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* 2. 调整宽度: max-w-md -> max-w-3xl，高度设为 h-[85vh] 保证足够空间 */}
            <div className="relative w-full max-w-[800px] h-[600px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* 关闭按钮 */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-30 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* 顶部背景与信息 (高度稍微加高一点 h-48 -> h-60 以适应更宽的卡片) */}
                <div className="relative h-60 shrink-0">
                    <img
                        src="src/assets/background.png" 
                        alt="背景"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-neutral-900/70" /> {/* 遮罩稍微加深一点 */}
                    
                    <div className="relative z-20 h-full flex items-end pb-6 px-8 gap-6">
                        {/* 头像稍微放大 */}
                        <img 
                            src={userInfo.avatar}
                            className="h-24 w-24 rounded-full border-4 border-white dark:border-neutral-800 shadow-lg object-cover bg-neutral-200"
                            alt="Avatar"
                        />
                        
                        <div className="flex-1 mb-1">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-2xl text-white tracking-wide">{userInfo.name}</span>
                                {/* 性别/年龄标签 */}
                                <div className="flex gap-2 text-[10px] text-white">
                                    {userInfo.gender && <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-xs">{userInfo.gender}</span>}
                                    {userInfo.age && <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-xs">{userInfo.age} 岁</span>}
                                    {userInfo.hometown && <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-xs">{userInfo.hometown}</span>}
                                    {userInfo.enable === false && (<span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-xs text-red-500">账号已封禁</span>)}
                                </div>
                            </div>
                            
                            <div className="text-xs text-gray-400 mt-1 font-mono">UID: {userInfo.uid}</div>
                            
                            {userInfo.signature && (
                                <p className="text-sm text-gray-200 mt-2 line-clamp-1 opacity-90">
                                    {userInfo.signature}
                                </p>
                            )}
                        </div>
                        <AddFriendButton targetUid={userInfo.uid} initialIsFriend={userInfo.friend}/>
                    </div>
                </div>

                {/* 底部内容区：包含按钮和作品列表 */}
                <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 flex flex-col">
                    
                   

                    <div className="p-4 md:p-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <span>发布帖子</span>
                        </h3>
                        
                        <div className="min-h-[200px]">
                            {userInfo.enable === false ? (
                                <div className="text-center text-red-500 mt-10">
                                    该用户账号已被封禁，无法查看其发布的内容。
                                </div>
                            ) : (
                                 <UserPostList uid={userInfo.uid} /> 
                            )

                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}