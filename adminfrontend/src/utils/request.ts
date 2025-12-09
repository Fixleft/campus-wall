import axios from 'axios';

const api = axios.create({
  // 开发环境走代理，生产环境走真实地址
  baseURL: '/', 
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ADMIN_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token 过期或无效，清除并跳回登录页
      localStorage.removeItem('ADMIN_TOKEN');
      localStorage.removeItem('ADMIN_INFO');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;