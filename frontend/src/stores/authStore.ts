import { create } from 'zustand';
import type { LoginCredentials, AuthUser } from '../models/auth';
import * as authApi from '../api/auth.api';

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  setError: (message: string | null) => void;
}

const LS_ACCESS = 'fiado_access_token';
const LS_REFRESH = 'fiado_refresh_token';

const decodeJwtPayload = (token: string): AuthUser => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    id: payload.user_id,
    username: payload.username || '',
    email: payload.email || '',
  };
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(credentials);
      const { access, refresh } = res.data;
      const user = decodeJwtPayload(access);
      localStorage.setItem(LS_ACCESS, access);
      localStorage.setItem(LS_REFRESH, refresh);
      set({
        user,
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.[0]?.detail ||
        err.message ||
        'Error al iniciar sesión';
      set({ isLoading: false, error: message, isAuthenticated: false });
    }
  },

  logout: () => {
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreSession: async () => {
    const access = localStorage.getItem(LS_ACCESS);
    const storedRefresh = localStorage.getItem(LS_REFRESH);
    if (!access || !storedRefresh) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      await authApi.verify(access);
      const user = decodeJwtPayload(access);
      set({
        user,
        accessToken: access,
        refreshToken: storedRefresh,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      try {
        const res = await authApi.refresh(storedRefresh);
        const newAccess = res.data.access;
        const newRefresh = res.data.refresh || storedRefresh;
        const user = decodeJwtPayload(newAccess);
        localStorage.setItem(LS_ACCESS, newAccess);
        localStorage.setItem(LS_REFRESH, newRefresh);
        set({
          user,
          accessToken: newAccess,
          refreshToken: newRefresh,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        get().logout();
        set({ isLoading: false });
      }
    }
  },

  setError: (message) => set({ error: message }),
}));
