import UserInfoEditCard from "@/components/UserInfoEditCard";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import MyPostList from "@/components/MyPostList";


export default function ProfilePage() {
    const { user, loading} = useUser();
    const [isEditOpen, setIsEditOpen] = useState(false);

    if (loading) return <p>加载中...</p>;
    if (!user) return <p>用户不存在</p>;
    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
            <div className="relative w-full pt-15 pb-5 h-60 px-20 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <img
                    src="src/assets/background.png"
                    alt="背景"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
                <div className="absolute inset-0 bg-neutral-800/80 z-10" />
                <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                    <img src={user.avatar}
                        className="h-30 w-30 shrink-0 rounded-full"
                        width={50}
                        height={50}
                        alt="Avatar"
                        >
                </img>
                <div className="flex-1 space-y-1 mt-4">
                    <div className="flex flex-wrap items-center gap-2 px-1">
                        <span className="font-semibold text-[24px] text-white">{user.name}</span>
                        <button onClick={() => setIsEditOpen(true)}>
                            <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 640 640"
                            className="h-5 w-5 shrink-0 text-black dark:text-white"
                            fill="currentColor"
                            >
                            <path d="M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z"/>
                            </svg>
                        </button>
                        <span className="text-[10px] text-white"> UID:{user.uid}</span>
                    </div>
                    {/* 详细信息（家乡、年龄、性别） */}
                <div className="flex flex-wrap items-center gap-4 text-[12px] text-white dark:text-gray-400">
                    {user.hometown && (
                    <div className="flex items-center gap-1">
                        <span className="bg-black py-1 px-2 rounded-[8px]">{user.hometown}</span>
                    </div>
                    )}

                    {user.age && (
                    <div className="flex items-center gap-1">
                        <span className="bg-black py-1 px-2 rounded-[8px]">{user.age} 岁</span>
                    </div>
                    )}

                    <div className="flex items-center gap-1">
                    <span className="bg-black py-1 px-2 rounded-[8px]">{user.gender}</span>
                    </div>
                    
                </div>
                {/* 个性签名 */}
                    {user.signature && (
                        <p className="text-[12px] text-white max-w-2xl mt-2 px-2">
                        {user.signature}
                        </p>
                    )}
                </div>
                </div>
                
            </div>
            
             <div className="max-w-[1600px] mx-auto">
                <MyPostList />
            </div>
            {/* 点击按钮后显示的组件 */}
            {isEditOpen && <UserInfoEditCard onClose={() => setIsEditOpen(false)} />}
        </div>
    )
}



