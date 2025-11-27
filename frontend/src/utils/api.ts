// src/utils/api.ts
import axios, { isAxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',  // 正确
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;   // 必须这样写！
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('登录已过期，请重新登录');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;