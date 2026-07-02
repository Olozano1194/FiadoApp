import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import * as authApi from '../../api/auth.api';

vi.mock('../../api/auth.api');

// Helper to create a valid JWT for testing decodeJwtPayload
const createTestToken = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
};

const VALID_TOKEN = createTestToken({
  user_id: 1,
  username: 'testuser',
  email: 'test@test.com',
});

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  storeName: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState(initialState);
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ── login ──────────────────────────────────────────────

  it('login: sets loading then succeeds with tokens', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        access: VALID_TOKEN,
        refresh: 'test-refresh',
        store_name: 'Mi Tienda',
      },
    } as any);

    const promise = useAuthStore.getState().login({ username: 'test', password: 'test' });
    expect(useAuthStore.getState().isLoading).toBe(true);

    await promise;

    const s = useAuthStore.getState();
    expect(s.isLoading).toBe(false);
    expect(s.isAuthenticated).toBe(true);
    expect(s.user).toEqual({ id: 1, username: 'testuser', email: 'test@test.com' });
    expect(s.accessToken).toBe(VALID_TOKEN);
    expect(s.refreshToken).toBe('test-refresh');
    expect(s.storeName).toBe('Mi Tienda');
    expect(localStorage.getItem('fiado_access_token')).toBe(VALID_TOKEN);
    expect(localStorage.getItem('fiado_refresh_token')).toBe('test-refresh');
  });

  it('login: sets error on generic failure', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Network error'));

    await useAuthStore.getState().login({ username: 'test', password: 'wrong' });

    const s = useAuthStore.getState();
    expect(s.isLoading).toBe(false);
    expect(s.isAuthenticated).toBe(false);
    expect(s.error).toBe('Error al iniciar sesión');
  });

  it('login: extracts detail from axios error response', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      response: { data: { detail: 'Credenciales inválidas' } },
    });

    await useAuthStore.getState().login({ username: 'test', password: 'wrong' });

    const s = useAuthStore.getState();
    expect(s.isLoading).toBe(false);
    expect(s.error).toBe('Credenciales inválidas');
  });

  // ── logout ─────────────────────────────────────────────

  it('logout: clears state and localStorage tokens', async () => {
    localStorage.setItem('fiado_access_token', VALID_TOKEN);
    localStorage.setItem('fiado_refresh_token', 'test-refresh');
    useAuthStore.setState({
      user: { id: 1, username: 'testuser', email: 'test@test.com' },
      accessToken: VALID_TOKEN,
      refreshToken: 'test-refresh',
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
    expect(s.storeName).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(localStorage.getItem('fiado_access_token')).toBeNull();
    expect(localStorage.getItem('fiado_refresh_token')).toBeNull();
  });

  // ── restoreSession ─────────────────────────────────────

  it('restoreSession: restores from valid localStorage tokens', async () => {
    localStorage.setItem('fiado_access_token', VALID_TOKEN);
    localStorage.setItem('fiado_refresh_token', 'test-refresh');
    vi.mocked(authApi.verify).mockResolvedValue({} as any);

    await useAuthStore.getState().restoreSession();

    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.user).toEqual({ id: 1, username: 'testuser', email: 'test@test.com' });
    expect(s.accessToken).toBe(VALID_TOKEN);
    expect(s.refreshToken).toBe('test-refresh');
  });

  it('restoreSession: refreshes token when verify fails', async () => {
    localStorage.setItem('fiado_access_token', VALID_TOKEN);
    localStorage.setItem('fiado_refresh_token', 'test-refresh');
    vi.mocked(authApi.verify).mockRejectedValue(new Error('expired'));

    const newToken = createTestToken({
      user_id: 1,
      username: 'testuser',
      email: 'test@test.com',
    });
    vi.mocked(authApi.refresh).mockResolvedValue({
      data: { access: newToken, refresh: 'new-refresh' },
    } as any);

    await useAuthStore.getState().restoreSession();

    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.accessToken).toBe(newToken);
    expect(s.refreshToken).toBe('new-refresh');
    expect(localStorage.getItem('fiado_access_token')).toBe(newToken);
    expect(localStorage.getItem('fiado_refresh_token')).toBe('new-refresh');
  });

  it('restoreSession: logs out when both verify and refresh fail', async () => {
    localStorage.setItem('fiado_access_token', VALID_TOKEN);
    localStorage.setItem('fiado_refresh_token', 'test-refresh');
    vi.mocked(authApi.verify).mockRejectedValue(new Error('expired'));
    vi.mocked(authApi.refresh).mockRejectedValue(new Error('refresh failed'));

    await useAuthStore.getState().restoreSession();

    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
  });

  it('restoreSession: no tokens in storage sets not authenticated', async () => {
    await useAuthStore.getState().restoreSession();

    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.isLoading).toBe(false);
  });

  // ── setError ───────────────────────────────────────────

  it('setError: updates error state', () => {
    useAuthStore.getState().setError('Something went wrong');
    expect(useAuthStore.getState().error).toBe('Something went wrong');

    useAuthStore.getState().setError(null);
    expect(useAuthStore.getState().error).toBeNull();
  });
});
