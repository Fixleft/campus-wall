// src/components/LoginForm.tsx
"use client";

import { useState } from "react";
import api from "@/utils/api";
import { useUser } from "@/data/UserContext";
import { resetLoginDialogState } from "@/utils/api";

interface LoginFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
  onClose: () => void;
}

export default function LoginForm({ onSuccess, onError, onClose }: LoginFormProps) {
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

  const handleCancel = () => {
    onClose(); // 关闭登录框
    resetLoginDialogState(); // 重置 api 中的状态
  };


  return (
    
    <div className="space-y-5 z-[100]">
     
      <input
        placeholder="昵称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none"
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none"
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
      />
      <div className="flex felx-row justify-between items-center gap-4">
        <button
        onClick={handleCancel}
        className="w-full py-3 bg-zinc-800 hover:from-purple-700 hover:bg-zinc-700 disabled:opacity-70 rounded-xl text-white font-medium transition shadow-lg"
        >
        取消
        </button>
        <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-70 rounded-xl text-white font-medium transition shadow-lg"
      >
        {loading ? "登录中..." : "立即登录"}
      </button>
      </div>
    </div>
  );
}