import { create } from 'zustand';
import type { LoginCredentials, AuthUser } from '../models/auth';
import * as authApi from '../api/auth.api';

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  storeName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setError: (message: string | null) => void;
}

const STORE_ACCESS = 'fiado_access_token';
const STORE_REFRESH = 'fiado_refresh_token';

// ── Lazy singleton for tauri-plugin-store ──
let _store: any | null = null;
let _storePromise: Promise<any | null> | null = null;

async function getStore(): Promise<any | null> {
  if (_store !== null) return _store;
  if (_storePromise === null) {
    _storePromise = (async () => {
      try {
        const { Store } = await import('@tauri-apps/plugin-store');
        _store = await Store.load('auth.json');
        return _store;
      } catch {
        // Running outside Tauri (browser dev mode) — fall back to null
        _store = null;
        return null;
      }
    })();
  }
  return _storePromise;
}

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
  storeName: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(credentials);
      const { access, refresh, store_name } = res.data;
      const user = decodeJwtPayload(access);

      // Persist tokens — via plugin-store in Tauri, localStorage fallback in browser
      const store = await getStore();
      if (store) {
        await store.set(STORE_ACCESS, access);
        await store.set(STORE_REFRESH, refresh);
      } else {
        localStorage.setItem(STORE_ACCESS, access);
        localStorage.setItem(STORE_REFRESH, refresh);
      }

      set({
        user,
        accessToken: access,
        refreshToken: refresh,
        storeName: store_name || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      let message = 'Error al iniciar sesión';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        message = axiosErr.response?.data?.detail ??
          (err as { response?: { data?: Array<{ detail: string }> } }).response?.data?.[0]?.detail ??
          message;
      }
      set({ isLoading: false, error: message, isAuthenticated: false });
    }
  },

  logout: async () => {
    const store = await getStore();
    if (store) {
      await store.remove(STORE_ACCESS);
      await store.remove(STORE_REFRESH);
    } else {
      localStorage.removeItem(STORE_ACCESS);
      localStorage.removeItem(STORE_REFRESH);
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      storeName: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreSession: async () => {
    const store = await getStore();

    let access: string | null;
    let storedRefresh: string | null;

    if (store) {
      access = await store.get(STORE_ACCESS);
      storedRefresh = await store.get(STORE_REFRESH);
    } else {
      access = localStorage.getItem(STORE_ACCESS);
      storedRefresh = localStorage.getItem(STORE_REFRESH);
    }

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

        if (store) {
          await store.set(STORE_ACCESS, newAccess);
          await store.set(STORE_REFRESH, newRefresh);
        } else {
          localStorage.setItem(STORE_ACCESS, newAccess);
          localStorage.setItem(STORE_REFRESH, newRefresh);
        }

        set({
          user,
          accessToken: newAccess,
          refreshToken: newRefresh,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        await get().logout();
        set({ isLoading: false });
      }
    }
  },

  setError: (message) => set({ error: message }),
}));
