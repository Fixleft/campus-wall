import api from '@/utils/request';

// 类型定义
export interface LoginParams { name: string; password: string; }
export interface LoginResult { token: string; uid: string; name: string; role: string; avatar: string; }

export interface PrivateMessage {
  id: number;
  content: string;
  senderUid: string;    // 发送者UID (可能是管理员，也可能是用户)
  recipientUid: string; // 接收者UID
  createdAt: string;
}
interface MessagePage {
  content: PrivateMessage[];
  totalPages: number;
}
export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  todayNewUsers: number;
  todayNewPosts: number;
  todayNewComments: number;
}
export const adminApi = {
  // --- 认证 ---
  login: (data: LoginParams) => api.post<LoginResult>('/admin/auth/login', data),

   sendPrivateMessage: (data: { recipientUid: string; content: string }) => 
    api.post('/api/social/message', null, { 
      params: {
        toUid: data.recipientUid,
        content: data.content,
      }
    }),

   getMessageHistory: (userUid: string) => 
    api.get<MessagePage>(`/api/social/message/history`, { // 路径修改
      params: {
        otherUid: userUid,
        page: 0, 
        size: 100 
      }
    }),

   getDashboardStats: () => api.get<DashboardStats>('/admin/dashboard/stats'),

   getFeedbackList: (params: { page: number; size: number }) => api.get('/admin/feedback/list', { params }),

  // --- 用户管理 ---
  // status: 1启用, 2禁用 (根据你的后端逻辑调整)
  getUsers: (params: { keyword?: string; status?: number; page: number; size: number }) => 
    api.get('/admin/user/list', { params }),
  
  // days > 0 禁言, days = 0 解禁
  muteUser: (uid: string, days: number) => api.post(`/admin/user/${uid}/mute`, null, { params: { days } }),
  
  banUser: (uid: string) => api.post(`/admin/user/${uid}/ban`),
  unbanUser: (uid: string) => api.post(`/admin/user/${uid}/unban`),
  resetPassword: (uid: string) => api.post(`/admin/user/${uid}/reset-password`),

  // --- 帖子管理 ---
  getPosts: (params: { keyword?: string; page: number; size: number }) => 
    api.get('/admin/post/list', { params }),
  
  blockPost: (postId: number) => api.post(`/admin/post/${postId}/block`),
  unblockPost: (postId: number) => api.post(`/admin/post/${postId}/unblock`),
  deletePostPhysical: (postId: number) => api.delete(`/admin/post/${postId}/delete`),

  // --- 评论管理 ---
  getComments: (params: { keyword?: string; page: number; size: number }) => 
    api.get('/admin/comment/list', { params }),
  
  deleteComment: (commentId: number) => api.delete(`/admin/comment/${commentId}`),
};