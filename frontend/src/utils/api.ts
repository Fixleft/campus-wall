// src/utils/api.ts
import axios, {  isAxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

const eventEmitter = new EventTarget();

// 请求拦截器：自动带 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== 关键：401 全局处理 ====================
let isRefreshing = false;
let isLoginDialogShown = false; 
// 失败请求队列（登录成功后全部重试）
const failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: AxiosRequestConfig;
}> = [];

const resetLoginDialogState = () => {
  isRefreshing = false;
  isLoginDialogShown = false;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const config = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (status === 401) {
        // 防止重复弹登录框
        if (!isRefreshing && !isLoginDialogShown) {
          isRefreshing = true;
          isLoginDialogShown = true;

          eventEmitter.dispatchEvent(new CustomEvent('show-login-dialog'));

          // 监听全局登录成功事件（AuthDialog 会触发这个）
          const handler = () => {
            isRefreshing = false;
            isLoginDialogShown = false;

            // 把队列里所有等待的请求重新发一次（带上新 token）
            failedQueue.forEach(({ resolve, config: queuedConfig }) => {
              const newToken = localStorage.getItem('token');
              if (newToken) {
                queuedConfig.headers = queuedConfig.headers || {};
                queuedConfig.headers.Authorization = `Bearer ${newToken}`;
              }
              resolve(api(queuedConfig));
            });
            failedQueue.length = 0;

            window.removeEventListener('auth-login-success', handler);
          };

          window.addEventListener('auth-login-success', handler);
        }

        // 把当前失败的请求加入队列，等登录成功后重试
        if (!config._retry) {
          config._retry = true;
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config });
          });
        }
      }
    }

    // 其它错误直接抛出
    return Promise.reject(error);
  }
);

export { resetLoginDialogState, eventEmitter };
export default api;