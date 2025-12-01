// src/components/AuthDialog.tsx
"use client";

import { useEffect } from "react";
import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/data/UserContext";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;

}




export default function AuthDialog({ isOpen, onClose, onLoginSuccess }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setErrorMsg] = useState("");
  const { refresh } = useUser();

  useEffect(() => {
  if (error) {
    const timer = setTimeout(() => setErrorMsg(""), 2000);
    return () => clearTimeout(timer);
  }
    }, [error]);

  const handleSuccess = () => {
    onClose();                    // 关闭弹窗
    onLoginSuccess?.();           // 触发全局登录成功事件（拦截器在监听这个！）
    refresh();                    // 刷新用户信息
    
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景蒙层 */}
      <div
        className="fixed inset-0  backdrop-blur-sm z-50"
        onClick={onClose}
      >
         {error && (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-5 left-1/2 transform -translate-x-1/2 z-60 w-full max-w-md p-8"
        >
            <Alert variant="destructive" className="rounded-lg bg-zinc-900 text-red  border-none">
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        </motion.div>
        )}
      </div>

      {/* 主弹窗 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div
          className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-800"
          onClick={(e) => e.stopPropagation()}
        >
         

          {/* 标题切换栏 */}
          <div className="flex border-b border-zinc-800">
           
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-5 text-lg font-medium transition-all relative ${
                mode === "login"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              登录
              {mode === "login"}
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-5 text-lg font-medium transition-all relative ${
                mode === "register"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              注册
              {mode === "register"}
            </button>
            
          </div>

          {/* 表单内容 */}
          <div className="p-8 pt-10">
            {mode === "login" ? (
              <LoginForm onSuccess={handleSuccess} onError={setErrorMsg} onClose={onClose}/>
            ) : (
              <RegisterForm onSuccess={handleSuccess} onError={setErrorMsg}/>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
