"use client";

import { X } from "lucide-react";
import { useState } from "react";
import api from '@/utils/api';
import { useUser } from "@/data/UserContext";  

interface LoginCardProps {
  onClose: () => void;
  onLoginSuccess?: (user: any) => void;
}

export default function LoginCard({ onClose, onLoginSuccess }: LoginCardProps) {
  const [username, setUsername] = useState("");
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  
  // 改这里！用正确的 context
  const { refresh } = useUser();

  const handleLogin = async () => {
    if (!username.trim() || !uid.trim() || !password) {
      alert("请填写完整信息");
      return;
    }

    try {
      const res = await api.post('/auth/login', {
        name: username.trim(),
        uid: uid.trim(),
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      refresh();

      onLoginSuccess?.(user);

      onClose();
      
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "登录失败，请检查信息或网络";
      alert(msg);
    }
  };


  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md max-h-160 overflow-y-auto text-white px-8 py-4">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800">
            <h2 className="text-xl font-semibold">账号登录</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div>
              <label className="block text-sm font-medium mb-1">名字</label>
              <input
                className="w-full px-4 py-2 bg-zinc-800 rounded-lg focus:outline-none text-white placeholder-zinc-500"
                placeholder="请输入名字"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Uid</label>
              <input
                className="w-full px-4 py-2 bg-zinc-800 rounded-lg focus:outline-none text-white placeholder-zinc-500"
                placeholder="请输入Uid"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-zinc-800 rounded-lg focus:outline-none text-white placeholder-zinc-500"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-5 pt-2">
              <button
                onClick={onClose}
                className="px-8 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition"
              >
                取消
              </button>

              <button
                onClick={handleLogin}
                className="px-8 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}