// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, MessageSquare, LayoutDashboard, LogOut,MessageSquareWarning
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import type { DashboardStats } from '@/api/admin';
import MediaPreview from '@/components/MediaPreview';
import ChatModal from '@/components/ChatModal';
import type { ChatTarget } from '@/components/ChatWindow';
import { ConfirmationDialog } from "@/components/AlertDialog";
import { toast } from "sonner";


// --- 类型定义 ---
interface Page<T> {
  content: T[];
  totalPages: number;
}
interface User {
  uid: string;
  name: string;
  enabled: boolean;
}
interface Post {
  id: number;
  content: string;
  authorName?: string;
  authorUid: string;
  createdAt: string;
  status: number;
  media: { url: string; type: 'image' | 'video' }[];
  tags: string[];
}
interface Comment {
  id: number;
  content: string;
  userName: string;
  createdAt: string;
}
export interface Feedback {
  title: string;
  content: string;
  uid: string;
  authorName: string;
  authorAvatar: string;
  createAt: string; 
}
// 【修复点 1】为 StatCard 的 color 定义一个严格的类型
type StatCardColor = 'blue' | 'purple' | 'green';

// 【修复点 2】为 StatCard 创建 Props 接口
interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  dailyChange?: string;
  trendIcon?: React.ElementType;
  color: StatCardColor;
}


// --- 可复用分页组件 ---
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {pageNumbers.map(number => (
        <button key={number} onClick={() => onPageChange(number)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            currentPage === number 
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
              : 'bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
          }`}
        >{number + 1}</button>
      ))}
    </div>
  );
}

// --- 主框架 ---
export default function AdminDashboard() {
    // ... 代码和上一个回答一致，这里省略 ...
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();
    const adminInfo = JSON.parse(localStorage.getItem('ADMIN_INFO') || '{}');
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const handleLogout = () => {
      localStorage.removeItem('ADMIN_TOKEN');
      localStorage.removeItem('ADMIN_INFO');
      navigate('/login');
      toast.success("已成功退出登录");
    };
  
    const navItems = [
      { id: 'overview', label: '仪表盘', icon: LayoutDashboard },
      { id: 'users', label: '用户管理', icon: Users },
      { id: 'posts', label: '帖子管理', icon: FileText },
      { id: 'comments', label: '评论管理', icon: MessageSquare },
      { id: 'feedback', label: '用户反馈', icon: MessageSquareWarning },
    ];
  
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex font-sans text-neutral-900 dark:text-neutral-100">
        <>
        <aside className="w-64 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 flex flex-col fixed h-full z-10">
          <div className="h-16 flex items-center px-6"><span className="font-bold text-lg dark:text-white">AdminPanel</span></div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 dark:text-neutral-400'}`}
              ><item.icon size={18} />{item.label}</button>
            ))}
          </nav>
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-900">
            <div className="flex items-center gap-3 p-2 mb-2">
              <div className="overflow-hidden">
                <div className="flex items-center gap-3">
                  <img 
                  className="h-8 w-8 rounded-full" 
                  src={adminInfo.avatar}
                  />
                  <p className="text-sm font-bold truncate dark:text-white">{adminInfo.name} · {adminInfo.role}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsLogoutDialogOpen(true)} className="w-full flex items-center justify-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 py-2 rounded-lg text-sm transition"><LogOut size={14} /> 退出登录</button>
          </div>
        </aside>
          <ConfirmationDialog 
          isOpen={isLogoutDialogOpen}
          onClose={() => setIsLogoutDialogOpen(false)}
          onConfirm={handleLogout}
          title="确认退出"
          description="您确定要退出当前管理员账号吗？"
          confirmText="退出"
        />
        </>
        
        <main className="flex-1 ml-64 flex flex-col min-w-0">
          <header className="h-16 bg-white/80 dark:bg-black/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-8 sticky top-0 z-20">
            <h2 className="text-lg font-bold dark:text-white">{navItems.find(i => i.id === activeTab)?.label}</h2>
          </header>
          <div className="flex-1 overflow-y-auto p-8"><div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'overview' && <OverviewSection />}
            {activeTab === 'users' && <UsersSection />}
            {activeTab === 'posts' && <PostsSection />}
            {activeTab === 'comments' && <CommentsSection />}
            {activeTab === 'feedback' && <FeedbackSection />}
          </div></div>
        </main>
      </div>
    );
}

function OverviewSection() {
    // ... 代码和上一个回答一致
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await adminApi.getDashboardStats();
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="text-center py-20 text-neutral-400">加载仪表盘数据中...</div>;
    }

    if (!stats) {
        return <div className="text-center py-20 text-red-400">无法加载仪表盘数据。</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold dark:text-white mb-4">概览</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Users} title="总用户数" value={stats.totalUsers.toLocaleString()} dailyChange={`今日新增 ${stats.todayNewUsers}`} color="blue" />
                <StatCard icon={FileText} title="总帖子数" value={stats.totalPosts.toLocaleString()} dailyChange={`今日新增 ${stats.todayNewPosts}`} color="purple" />
                <StatCard icon={MessageSquare} title="总评论数" value={stats.totalComments.toLocaleString()} dailyChange={`今日新增 ${stats.todayNewComments}`} color="green" />
            </div>
           
        </div>
    );
}

// 【修复点 3】在组件参数中应用 Props 接口
function StatCard({ icon: Icon, title, value, dailyChange, trendIcon: TrendIcon, color }: StatCardProps) {
    // 这个对象现在是类型安全的
    const colorClasses: Record<StatCardColor, { bg: string; text: string }> = {
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
        purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
        green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
    };

    // 因为 color 的类型是 'blue'|'purple'|'green'，所以这里可以安全地索引
    const finalColorClasses = colorClasses[color];

    return (
        <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${finalColorClasses.bg} ${finalColorClasses.text}`}>
                    <Icon size={24} />
                </div>
                {dailyChange && (
                    <div className="flex items-center gap-1 text-xs text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                        {TrendIcon && <TrendIcon size={12} />} {dailyChange}
                    </div>
                )}
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
            <p className="text-3xl font-bold mt-1 dark:text-white">{value}</p>
        </div>
    );
}



// --- 后续的用户、帖子、评论组件代码和上一个回答完全一致，这里省略 ---
function UsersSection() {
    // ...
    const [data, setData] = useState<Page<User>>({ content: [], totalPages: 0 });
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [dialogState, setDialogState] = useState<{
      isOpen: boolean;
      type: 'ban' | 'mute' | 'reset' | null;
      user: User | null;
    }>({ isOpen: false, type: null, user: null });
    const fetchUsers = async (currentPage = 0) => {
      setLoading(true);
      try {
        const res = await adminApi.getUsers({ page: currentPage, size: 10, keyword });
        setData({ content: res.data.content || [], totalPages: res.data.totalPages || 0 });
      } finally { setLoading(false); }
    };
    useEffect(() => { fetchUsers(page); }, [page]);
  
   const handleConfirmAction = async () => {
    const { type, user } = dialogState;
    if (!type || !user) return;

    try {
      if (type === 'ban') {
        await (user.enabled ? adminApi.banUser(user.uid) : adminApi.unbanUser(user.uid));
        toast.success(`用户 ${user.name} 已${user.enabled ? '封禁' : '解封'}`);
      }
      if (type === 'reset') {
        await adminApi.resetPassword(user.uid);
        toast.success(`用户 ${user.name} 的密码已重置`);
      }
      if (type === 'mute') {
        // 对于需要输入的，我们暂时还用 prompt，但提示可以用 toast
        const days = prompt(`为用户 ${user.name} 设置禁言天数 (输入 0 解除禁言):`, "1");
        if (days === null || isNaN(Number(days))) return;
        await adminApi.muteUser(user.uid, Number(days));
        toast.success(Number(days) > 0 ? `用户 ${user.name} 已被禁言 ${days} 天` : `已解除用户 ${user.name} 的禁言`);
      }
      fetchUsers(page);
    } catch(e) { 
      toast.error('操作失败，请稍后重试');
    } finally {
      setDialogState({ isOpen: false, type: null, user: null }); // 关闭弹窗
    }
  };

   const openConfirmation = (type: 'ban' | 'mute' | 'reset', user: User) => {
    // 禁言直接使用 prompt
    if (type === 'mute') {
      const days = prompt(`为用户 ${user.name} 设置禁言天数 (输入 0 解除禁言):`, "1");
      if (days === null || isNaN(Number(days))) return;
      
      const executeMute = async () => {
          try {
              await adminApi.muteUser(user.uid, Number(days));
              toast.success(Number(days) > 0 ? `用户 ${user.name} 已被禁言 ${days} 天` : `已解除用户 ${user.name} 的禁言`);
              fetchUsers(page);
          } catch(e) {
              toast.error('操作失败');
          }
      };
      executeMute();
      return;
    }
    setDialogState({ isOpen: true, type, user });
  };
  
  // 动态生成 dialog 的描述文本
  const getDialogDescription = () => {
    const { type, user } = dialogState;
    if (!user) return '';
    switch(type) {
      case 'ban': return `您确定要【${user.enabled ? '封禁' : '解封'}】用户 "${user.name}" 吗？`;
      case 'reset': return `您确定要将用户 "${user.name}" 的密码重置为 "123456" 吗？`;
      default: return '';
    }
  };
  
    return (
      <>
      <div className="space-y-4">
        <div className="flex gap-2">
           <input placeholder="搜索用户UID或昵称..." className="px-4 py-2 rounded-lg bg-white dark:bg-black border border-neutral-200 flex-1" value={keyword} onChange={e=>setKeyword(e.target.value)} />
           <button onClick={() => { setPage(0); fetchUsers(0); }} className="px-4 py-2 bg-black text-white rounded-lg dark:bg-white dark:text-black">搜索</button>
        </div>
        <div className="bg-white dark:bg-black rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500"><tr><th className="px-6 py-4">用户</th><th className="px-6 py-4">状态</th><th className="px-6 py-4 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading && !data.content.length ? <tr><td colSpan={3} className="p-8 text-center text-neutral-400">加载中...</td></tr> : data.content.map(user => (
                <tr key={user.uid} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  <td className="px-6 py-4"><div className="font-bold dark:text-white">{user.name}</div><div className="text-xs text-neutral-400">{user.uid}</div></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs ${user.enabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>{user.enabled ? '正常' : '封禁中'}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 text-xs font-medium">
                       <button onClick={() => openConfirmation('mute', user)} className="text-yellow-600 hover:underline">禁言</button>
                       <button onClick={() => openConfirmation('reset', user)} className="text-blue-600 hover:underline">重置密码</button>
                       <button onClick={() => openConfirmation('ban', user)} className={user.enabled ? "text-red-600 hover:underline" : "text-green-600 hover:underline"}>
                          {user.enabled ? "封禁" : "解封"}
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
      </div>
        <ConfirmationDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState({ isOpen: false, type: null, user: null })}
          onConfirm={handleConfirmAction}
          title="请确认操作"
          description={getDialogDescription()}
        />
      </>
    );
}
function PostsSection() {
    // ...
    const [data, setData] = useState<Page<Post>>({ content: [], totalPages: 0 });
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');

     const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        type: 'toggleBlock' | 'delete' | null;
        post: Post | null;
    }>({isOpen: false, type: null, post: null});
  
    const fetchPosts = async (currentPage = 0) => {
      setLoading(true);
      try {
        const res = await adminApi.getPosts({ page: currentPage, size: 10, keyword });
        setData({ content: res.data.content || [], totalPages: res.data.totalPages || 0 });
      } finally { setLoading(false); }
    };
    useEffect(() => { fetchPosts(page); }, [page]);
    
    const handleConfirmAction = async () => {
        const { type, post } = dialogState;
        if (!type || !post) return;
        try {
            if (type === 'toggleBlock') {
                const isBlocked = post.status === 1;
                await (isBlocked ? adminApi.unblockPost(post.id) : adminApi.blockPost(post.id));
                toast.success(`帖子已成功${isBlocked ? '恢复' : '下架'}`);
            }
            if (type === 'delete') {
                await adminApi.deletePostPhysical(post.id);
                toast.warning('帖子已彻底删除');
            }
            fetchPosts(page);
        } catch (e) { toast.error('操作失败'); }
        finally { setDialogState({isOpen: false, type: null, post: null}); }
    };

    const openConfirmation = (type: 'toggleBlock' | 'delete', post: Post) => {
        setDialogState({isOpen: true, type, post});
    };
    
    const getDialogDescription = () => {
        const { type, post } = dialogState;
        if (!post) return '';
        switch(type) {
            case 'toggleBlock': return `您确定要【${post.status === 1 ? '恢复' : '下架'}】这个帖子吗？`;
            case 'delete': return '【警告】此操作不可恢复！您确定要彻底删除这个帖子吗？';
            default: return '';
        }
    };
  
    return (
      <>
      <div className="space-y-4">
         <div className="flex gap-2">
           <input placeholder="搜索帖子内容或UID..." className="px-4 py-2 rounded-lg bg-white dark:bg-black border border-neutral-200 flex-1" value={keyword} onChange={e=>setKeyword(e.target.value)}/>
           <button onClick={() => { setPage(0); fetchPosts(0); }} className="px-4 py-2 bg-black text-white rounded-lg dark:bg-white dark:text-black">搜索</button>
        </div>
        {loading && !data.content.length && <div className="text-center text-neutral-400 py-10">加载中...</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.content.map((post) => (
            <div key={post.id} className="bg-white dark:bg-black p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col">
               <div className="flex justify-between items-start text-xs text-neutral-500 mb-2">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">{post.authorName || `用户UID: ${post.authorUid}`}</span>
                  <span className={`px-2 py-0.5 rounded ${post.status === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{post.status === 0 ? '正常' : '已下架'}</span>
               </div>
               <p className="text-sm text-neutral-800 dark:text-neutral-300 mb-2 whitespace-pre-wrap">{post.content}</p>
               <MediaPreview media={post.media} />
               <div className="flex flex-wrap gap-2 mb-3 mt-1">
                  {post.tags?.map((tag: string, i: number) => <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">{tag}</span>)}
               </div>
               <div className="flex-grow"></div>
               <div className="flex justify-between items-center pt-3 mt-auto border-t border-neutral-100 dark:border-neutral-800 text-xs font-medium">
                  <span className="text-neutral-400">ID: {post.id}</span>
                  <div className="flex gap-4">
                     <button onClick={() => openConfirmation('toggleBlock', post)} className={post.status === 1 ? "text-green-600 hover:underline" : "text-orange-600 hover:underline"}>
                        {post.status === 1 ? '恢复' : '下架'}
                     </button>
                     <button onClick={() => openConfirmation('delete', post)} className="text-red-600 hover:underline">删除</button>
                  </div>
               </div>
            </div>
          ))}
        </div>
        <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
      </div>
      <ConfirmationDialog 
                isOpen={dialogState.isOpen}
                onClose={() => setDialogState({isOpen: false, type: null, post: null})}
                onConfirm={handleConfirmAction}
                title="请确认操作"
                description={getDialogDescription()}
                confirmText={dialogState.type === 'delete' ? '确认删除' : '确认'}
            />
        </>
    );
}
function CommentsSection() {
    // ...
    const [data, setData] = useState<Page<Comment>>({ content: [], totalPages: 0 });
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dialogState, setDialogState] = useState<{ isOpen: boolean; commentId: number | null }>({isOpen: false, commentId: null});
    const fetchComments = async (currentPage = 0) => {
      setLoading(true);
      try {
        const res = await adminApi.getComments({ page: currentPage, size: 20 });
        setData({ content: res.data.content || [], totalPages: res.data.totalPages || 0 });
      } finally { setLoading(false); }
    };
    useEffect(() => { fetchComments(page); }, [page]);
  
    const handleConfirmDelete = async () => {
        if (!dialogState.commentId) return;
        try { 
            await adminApi.deleteComment(dialogState.commentId); 
            toast.success('评论已删除');
            fetchComments(page); 
        } catch(e) { 
            toast.error('删除失败'); 
        } finally {
            setDialogState({isOpen: false, commentId: null});
        }
    };
    
    const openDeleteDialog = (id: number) => {
        setDialogState({isOpen: true, commentId: id});
    };
  
    return (
      <>
      <div className="bg-white dark:bg-black rounded-xl border border-neutral-200">
        {loading && !data.content.length && <div className="text-center p-8 text-neutral-400">加载中...</div>}
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {data.content.map(c => (
            <li key={c.id} className="p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-900">
               <div className="flex-1">
                  <div className="text-xs text-neutral-500 mb-1">{c.userName} • {new Date(c.createdAt).toLocaleDateString()}</div>
                  <p className="text-sm text-neutral-800 dark:text-neutral-300">{c.content}</p>
               </div>
               <button onClick={() => openDeleteDialog(c.id)} className="text-red-600 hover:underline text-xs font-medium">删除</button>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      </div>
      <ConfirmationDialog
                isOpen={dialogState.isOpen}
                onClose={() => setDialogState({isOpen: false, commentId: null})}
                onConfirm={handleConfirmDelete}
                title="确认删除评论"
                description="您确定要删除这条评论吗？此操作无法撤销。"
            />
        </>
    );
}
function FeedbackSection() {
  const [data, setData] = useState<Page<Feedback>>({ content: [], totalPages: 0 });
  const [page, setPage] = useState(0);

  
  // 【2. 修改】状态：isModalOpen 控制开关，chatTarget 存储数据
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);

  useEffect(() => {
    // ... fetchFeedback 逻辑不变 ...
    const fetchFeedback = async (currentPage = 0) => {
      
      try {
        const res = await adminApi.getFeedbackList({ page: currentPage, size: 10 });
        setData({ content: res.data.content || [], totalPages: res.data.totalPages || 0 });
      } catch (e) {
        console.error('获取用户反馈失败', e);
      }
    };
    fetchFeedback(page);
  }, [page]);

  // 【3. 新增】打开弹窗的函数
  const handleOpenChat = (feedback: Feedback) => {
    setChatTarget({
      uid: feedback.uid,
      name: feedback.authorName,
      avatar: feedback.authorAvatar,
    });
    setIsModalOpen(true);
  };

  // 关闭弹窗的函数
  const handleCloseChat = () => {
    setIsModalOpen(false);
    // 延迟清空数据，让退出动画更平滑
    setTimeout(() => setChatTarget(null), 300); 
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold dark:text-white">用户反馈列表</h2>
      <div className="bg-white dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {data.content.map((feedback) => (
            <li key={feedback.uid + feedback.createAt} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={feedback.authorAvatar} className="w-10 h-10 rounded-full bg-neutral-200" alt={feedback.authorName} />
                <div className="flex-1">
                  <p className="text-sm font-semibold dark:text-white">{feedback.authorName}</p>
                  <p className="text-xs text-neutral-500">UID: {feedback.uid}</p>
                </div>
                <button 
                  onClick={() => handleOpenChat(feedback)} // 【4. 修改】点击按钮，调用打开弹窗的函数
                  className="ml-auto text-blue-600 hover:underline text-xs font-medium"
                >
                  联系用户
                </button>
              </div>
              <div className="pl-12 border-l-2 border-neutral-100 dark:border-neutral-800 ml-5">
                 <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-base">{feedback.title}</h3>
                 <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 whitespace-pre-wrap">{feedback.content}</p>
                 <p className="text-xs text-neutral-400 mt-3">{new Date(feedback.createAt).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />

      {/* 【5. 替换】使用 ChatModal 组件 */}
      <ChatModal 
        isOpen={isModalOpen}
        onClose={handleCloseChat}
        target={chatTarget}
      />
    </div>
  );
}