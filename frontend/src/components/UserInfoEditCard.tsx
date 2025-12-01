'use client';

import { X, Camera } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/data/UserContext';
import api from '@/utils/api';

interface UserInfoEditCardProps {
  onClose: () => void;
}

export default function UserInfoEditCard({ onClose }: UserInfoEditCardProps) {
  const { user, refresh } = useUser();

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState(user?.gender || '男');
  const [age, setAge] = useState(user?.age || 0);
  const [hometown, setHometown] = useState(user?.hometown || '');
  const [signature, setSignature] = useState(user?.signature || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 点击头像区域选择文件
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // 图片预览
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 提交更新
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setIsLoading(true);
    setError(null);

    let finalAvatarUrl = avatarUrl;

    try {
        if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const res = await api.post("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        finalAvatarUrl = res.data; // 后端返回的永久 URL
      }

      await api.put(`/users/${user.uid}/update`, {
        avatar: finalAvatarUrl,
        name,
        gender,
        age,
        hometown,
        signature,
      });

      // 更新 UserContext
      refresh();  
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '更新失败');
    } finally {
      setSaving(false);
      setIsLoading(false);  
    }
  };

  // 如果用户信息变化（Context 刷新），自动更新本地状态
  useEffect(() => {
    if (user) {
      setAvatarUrl(user.avatar || '');
      setName(user.name || '');
      setGender(user.gender || '');
      setAge(user.age || 0);
      setHometown(user.hometown || '');
      setSignature(user.signature || '');
    }
  }, [user]);

  if (!user) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* 居中卡片 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md max-h-160 overflow-y-auto text-white px-8 py-4">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800">
            <h2 className="text-xl font-semibold">编辑资料</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-2 space-y-3">
            {/* 头像 */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-25 h-25 rounded-full overflow-hidden border-4 border-zinc-700">
                  <img src={avatarUrl} alt="头像" className="w-full h-full object-cover" />
                </div>
                <div
                  onClick={handleAvatarClick}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Camera className="w-10 h-10" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* 表单 */}
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">名字</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 rounded-lg focus:outline-none text-white placeholder-zinc-500"
                  placeholder="请输入名字"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">性别</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 rounded-lg focus:outline-none text-white"
                >
                  <option>男</option>
                  <option>女</option>
                  <option>保密</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">年龄</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-zinc-800 rounded-lg focus:outline-none text-white placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">地区</label>
                <input
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 rounded-lg focus:outline-none text-white placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">签名</label>
                <input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 rounded-lg focus:outline-none text-white placeholder-zinc-500 resize-none"
                />
              </div>
            </div>

            {/* 按钮 */}
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-end gap-5">
              <button
                onClick={onClose}
                className="px-8 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition"
                disabled={saving}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                disabled={saving}
              >
                {isLoading ? '保存中...' : '保存更改'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
