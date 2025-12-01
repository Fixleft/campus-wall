"use client";

import { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Square from "@/pages/Square";
import ProfilePage from "./ProfilePage";
import { useUser } from "@/data/UserContext";   
import ConfirmDialog from "@/components/ConfirmDialog";
import AuthDialog from "@/components/AuthDialog";
import { eventEmitter } from '@/utils/api';


const SettingsPage = () => (
  <div className="p-10">
    <h1 className="text-3xl font-bold">设置</h1>
    <p>偏好设置、主题、通知等</p>
  </div>
);
const FriendsPage = () => (
  <div className="p-10">
    <h1 className="text-3xl font-bold">好友</h1>
    <p>加好友</p>
  </div>
);
const EmailPage = () => (
  <div className="p-10">
    <h1 className="text-3xl font-bold">私信</h1>
    <p>发私信</p>
  </div>
);




type Page = "square" | "profile" | "settings" | "friends" | "email";

export function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>("square");
  const [open, setOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { user, loading, logout } = useUser();
  const [loginCardOpen, setLoginCardOpen] = useState(false);
 
  useEffect(() => {
    // 监听 'show-login-dialog' 事件
    const handleShowLoginDialog = () => {
      setLoginCardOpen(true);
    };

    // 添加事件监听器
    eventEmitter.addEventListener('show-login-dialog', handleShowLoginDialog);

    // 清理监听器
    return () => {
      eventEmitter.removeEventListener('show-login-dialog', handleShowLoginDialog);
    };
  }, []);

  const links = [
    {
      label: "广场",
      href: "#",
      page: "square" as Page,
      icon: <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 640 640"
            className="h-5 w-5 shrink-0 text-black dark:text-white"
            fill="currentColor"
            >
            <path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z"/>      </svg>,
    },
    {
      label: "我的",
      href: "#",
      page: "profile" as Page,
      icon: <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 640 640"
            className="h-5 w-5 shrink-0 text-black dark:text-white"
            fill="currentColor"
            >
        <path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"/>
      </svg>,
    },
    {
      label: "好友",
      href: "#",
      page: "friends" as Page,
      icon: <svg
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 640 640"
      className="h-5 w-5 shrink-0 text-black dark:text-white"
      fill="currentColor"
      >
      <path d="M96 192C96 130.1 146.1 80 208 80C269.9 80 320 130.1 320 192C320 253.9 269.9 304 208 304C146.1 304 96 253.9 96 192zM32 528C32 430.8 110.8 352 208 352C305.2 352 384 430.8 384 528L384 534C384 557.2 365.2 576 342 576L74 576C50.8 576 32 557.2 32 534L32 528zM464 128C517 128 560 171 560 224C560 277 517 320 464 320C411 320 368 277 368 224C368 171 411 128 464 128zM464 368C543.5 368 608 432.5 608 512L608 534.4C608 557.4 589.4 576 566.4 576L421.6 576C428.2 563.5 432 549.2 432 534L432 528C432 476.5 414.6 429.1 385.5 391.3C408.1 376.6 435.1 368 464 368z"/></svg>
    },
     {
      label: "消息",
      href: "#",
      page: "email" as Page,
      icon: <svg
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 640 640"
      className="h-5 w-5 shrink-0 text-black dark:text-white"
      fill="currentColor"
      >
      <path d="M64 416L64 192C64 139 107 96 160 96L480 96C533 96 576 139 576 192L576 416C576 469 533 512 480 512L360 512C354.8 512 349.8 513.7 345.6 516.8L230.4 603.2C226.2 606.3 221.2 608 216 608C202.7 608 192 597.3 192 584L192 512L160 512C107 512 64 469 64 416z"/></svg>    },
    {
      label: "设置",
      href: "#",
      page: "settings" as Page,
      icon: <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 640 640"
            className="h-5 w-5 shrink-0 text-black dark:text-white"
            fill="currentColor"
            >
            <path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
      </svg>,
    },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "square": return <Square />;
      case "profile": return <ProfilePage />;
      case "settings": return <SettingsPage />;
      case "friends": return <FriendsPage />;
      case "email": return <EmailPage />;
      default: return <Square />;
    }
  };

  return (
    <div className={cn(
      "flex w-full flex-1 flex-col overflow-hidden bg-gray-500 md:flex-row dark:bg-neutral-800",
      "h-screen",
    )}>
      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <Logo />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <div
                  key={link.label}
                  onClick={() => {
                  if (link.page === "profile" && !user) {
                    setLoginCardOpen(true); 
                  } else {
                    setCurrentPage(link.page); 
                  }
                }}
                  className={cn(
                    "rounded-md transition-all cursor-pointer px-1",
                    currentPage === link.page
                      ? "bg-neutral-200 dark:bg-neutral-700 shadow-sm"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  <SidebarLink
                    link={{
                      label: link.label,
                      href: "#",
                      icon: link.icon,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 底部：用户信息 + 退出登录 */}
          <div className="space-y-3 pb-4">
            {/* 用户头像 + 名字 */}
            <SidebarLink
              link={{
                label: user?.name || "未登录",
                href: "#",
                icon: (
                  <img
                    src={user?.avatar || "src/assets/default-avatar.png"}
                    className="h-7 w-7 shrink-0 rounded-full ring-2 ring-white/20"
                    alt="头像"
                  />
                ),
              }}
              onClick={() => {
                if (!user) {
                  setLoginCardOpen(true);
                }
                else {
                  setCurrentPage("profile");
                }
              }}
            />

            {/* 退出登录按钮 */}
            {user && (
            <>
              <SidebarLink
                link={{
                  label: "退出登录",
                  href: "#",
                  icon: <IconArrowLeft className="h-5 w-5" />,
                }}
                onClick={() => setLogoutDialogOpen(true)}
              />

              <ConfirmDialog
                isOpen={logoutDialogOpen}
                title="退出登录"
                message="你确定要退出登录吗？"
                confirmText="退出"
                cancelText="取消"
                onConfirm={()=>{
                   logout();
                   setCurrentPage("square");
                }}
                onCancel={() => setLogoutDialogOpen(false)}
              />
            </>
          )}
          </div>
        </SidebarBody>
      </Sidebar>

      {loginCardOpen && (
        <AuthDialog
          isOpen={loginCardOpen}
          onClose={() => setLoginCardOpen(false)}
        />
      )}
      
      {/* 主内容区 */}
      <div className="flex flex-1 flex-col bg-white dark:bg-neutral-900">
        <div className="flex-1 overflow-y-auto border border-neutral-200 dark:border-neutral-700">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xl">加载中...</div>
          ) : (
            renderPage()
          )}
        </div>
      </div>
    </div>
  );
}


export const Logo = () => {
  return (
    <a href="#" className="relative z-20 flex items-center space-x-2.5 py-1 text-sm font-normal">
      <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 640 640"
            className="h-7 w-7 shrink-0 text-black dark:text-white"
            fill="currentColor"
            >
            <path d="M352.5 32C383.4 32 408.5 57.1 408.5 88C408.5 118.9 383.4 144 352.5 144C321.6 144 296.5 118.9 296.5 88C296.5 57.1 321.6 32 352.5 32zM219.6 240C216.3 240 213.4 242 212.2 245L190.2 299.9C183.6 316.3 165 324.3 148.6 317.7C132.2 311.1 124.2 292.5 130.8 276.1L152.7 221.2C163.7 193.9 190.1 176 219.6 176L316.9 176C345.4 176 371.7 191.1 386 215.7L418.8 272L480.4 272C498.1 272 512.4 286.3 512.4 304C512.4 321.7 498.1 336 480.4 336L418.8 336C396 336 375 323.9 363.5 304.2L353.5 287.1L332.8 357.5L408.2 380.1C435.9 388.4 450 419.1 438.3 445.6L381.7 573C374.5 589.2 355.6 596.4 339.5 589.2C323.4 582 316.1 563.1 323.3 547L372.5 436.2L276.6 407.4C243.9 397.6 224.6 363.7 232.9 330.6L255.6 240L219.7 240zM211.6 421C224.9 435.9 242.3 447.3 262.8 453.4L267.5 454.8L260.6 474.1C254.8 490.4 244.6 504.9 231.3 515.9L148.9 583.8C135.3 595 115.1 593.1 103.9 579.5C92.7 565.9 94.6 545.7 108.2 534.5L190.6 466.6C195.1 462.9 198.4 458.1 200.4 452.7L211.6 421z"/>      
      </svg>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white"
      >
        DashBoard
      </motion.span>
    </a>
  );
};