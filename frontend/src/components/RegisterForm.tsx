// src/components/RegisterForm.tsx
"use client";

import { useState } from "react";
import api from "@/utils/api";
import { useUser } from "@/data/UserContext";


interface RegisterFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useUser();

  
  const handleRegister = async () => {
    if (!name.trim()) return onError("请输入名字");
    if (password.length < 6) return onError("密码至少6位");

    setLoading(true);
    try {
      // 后端只接收 name 和 password，uid 自动生成
      const res = await api.post("/auth/register", {
        name: name.trim(),
        password,
      });

     
      const { token, user } = res.data;

      // 自动登录
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
    
    <div className="space-y-5 z-[100]">
       
      <input
        placeholder="昵称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none "
        autoFocus
      />

      <input
        type="password"
        placeholder="设置密码（至少6位）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none "
        onKeyDown={(e) => e.key === "Enter" && handleRegister()}
      />

      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-70 rounded-xl text-white font-medium transition shadow-lg"
      >
        {loading ? "注册中..." : "立即加入校园墙"}
      </button>

    </div>
  );
}