// src/components/AuthDialog.tsx
"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/context/UserContext";
import api, { resetLoginDialogState } from "@/utils/api";

// --- 类型定义 ---
interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

// --- 主组件 ---
export default function AuthDialog({ isOpen, onClose, onLoginSuccess }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setErrorMsg] = useState("");
  const { refresh } = useUser();

  // 错误信息自动消失
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setErrorMsg(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSuccess = () => {
    onClose();
    onLoginSuccess?.();
    refresh();
  };

  const handleClose = () => {
    onClose();
    resetLoginDialogState(); // 保持你原有的重置逻辑
    setTimeout(() => {
        setMode("login"); // 关闭后重置为登录模式
        setErrorMsg("");
    }, 200);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        {/* 1. 背景蒙层 (Backdrop) */}
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" // z-index 设高一点
          />
        </Dialog.Overlay>

        {/* 2. 弹窗内容容器 */}
        <Dialog.Content asChild>
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 rounded-[16px] shadow-[16px] w-full max-w-md overflow-hidden border border-zinc-800 pointer-events-auto outline-none"
            >
              {/* 错误提示 - 绝对定位在顶部 */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 left-4 right-4 z-50"
                  >
                    <Alert variant="destructive" className="rounded-lg bg-zinc-900 border border-red-900 text-red-500 shadow-xl py-2">
                      <AlertDescription className="text-center text-sm">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 标题切换栏 */}
              <div className="flex border-b border-zinc-800 relative z-10 bg-zinc-900">
                <TabButton 
                  active={mode === "login"} 
                  onClick={() => setMode("login")} 
                  label="登录" 
                />
                <TabButton 
                  active={mode === "register"} 
                  onClick={() => setMode("register")} 
                  label="注册" 
                />
              </div>

              {/* 表单内容区域 */}
              <div className="p-8 pt-6 bg-zinc-900">
                <AnimatePresence mode="wait">
                  {mode === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <LoginFormLogic 
                        onSuccess={handleSuccess} 
                        onError={setErrorMsg} 
                        onClose={handleClose} 
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <RegisterFormLogic 
                        onSuccess={handleSuccess} 
                        onError={setErrorMsg} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// --- 子组件：Tab 按钮 ---
function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-5 text-lg font-medium transition-all relative outline-none ${
        active ? "text-white" : "text-zinc-500 hover:text-zinc-400"
      }`}
    >
      {label}
      {active && (
        <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
      )}
    </button>
  );
}

// --- 子组件：登录逻辑 ---
function LoginFormLogic({ onSuccess, onError, onClose }: { onSuccess: () => void; onError: (msg: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useUser();

  const handleLogin = async () => {
    if (!name || !password) return onError("请输入昵称和密码");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        name: name.trim(),
        password,
      });
      const { token } = res.data;
      localStorage.setItem("token", token);
      await refresh();
      onSuccess();
    } catch (err: any) {
      onError(err.response?.data?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <input
        placeholder="昵称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none transition-all"
        autoFocus // 自动聚焦
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none transition-all"
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
      />
      <div className="flex flex-row justify-between items-center gap-4">
        <button
          onClick={onClose}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition shadow-lg outline-none"
        >
          取消
        </button>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 bg-white disabled:opacity-70 rounded-xl text-black hover:bg-zinc-500 font-medium transition shadow-lg outline-none"
        >
          {loading ? "登录中..." : "立即登录"}
        </button>
      </div>
    </div>
  );
}

// --- 子组件：注册逻辑 ---
function RegisterFormLogic({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useUser();

  const handleRegister = async () => {
    if (!name.trim()) return onError("请输入名字");
    if (password.length < 6) return onError("密码至少6位");

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: name.trim(),
        password,
      });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      await refresh();
      onSuccess();
    } catch (err: any) {
      onError(err.response?.data?.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <input
        placeholder="昵称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none transition-all"
        autoFocus
      />
      <input
        type="password"
        placeholder="设置密码（至少6位）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none transition-all"
        onKeyDown={(e) => e.key === "Enter" && handleRegister()}
      />
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full py-3.5 bg-white hover:from-purple-700 hover:bg-zinc-500 disabled:opacity-70 rounded-xl text-black font-medium transition shadow-lg outline-none"
      >
        {loading ? "注册中..." : "立即加入校园墙"}
      </button>
    </div>
  );
}