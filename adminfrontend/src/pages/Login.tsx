// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import type { LoginResult } from '@/api/admin';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await adminApi.login(form);
      const data = res.data as unknown as LoginResult; // axios 泛型处理

      // 存储 Token
      localStorage.setItem('ADMIN_TOKEN', data.token);
      localStorage.setItem('ADMIN_INFO', JSON.stringify({
        uid: data.uid,
        name: data.name,
        role: data.role,
        avatar: data.avatar
      }));

      // 跳转主页
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-black w-full max-w-md p-8 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="用户名"
              required
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-neutral-400" size={20} />
            <input
              type="password"
              placeholder="密码"
              required
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}