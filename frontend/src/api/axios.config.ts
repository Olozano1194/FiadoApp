import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL_DEV || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const LS_ACCESS = 'fiado_access_token';
const LS_REFRESH = 'fiado_refresh_token';

export const getAccessToken = () => localStorage.getItem(LS_ACCESS);
export const getRefreshToken = () => localStorage.getItem(LS_REFRESH);

export const setAuthTokens = (access: string, refresh?: string) => {
  localStorage.setItem(LS_ACCESS, access);
  if (refresh) localStorage.setItem(LS_REFRESH, refresh);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(LS_ACCESS);
  localStorage.removeItem(LS_REFRESH);
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/token/')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}token/refresh/`, {
        refresh: refreshToken,
      });
      const { access, refresh } = response.data;
      setAuthTokens(access, refresh || refreshToken);
      processQueue(null, access);
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthTokens();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
