import { vi } from 'vitest';
import type { AuthUser } from '../../models/auth';

export interface MockAuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  storeName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  restoreSession: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
}

export const defaultAuthStoreState: MockAuthStore = {
  user: null,
  accessToken: null,
  refreshToken: null,
  storeName: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  restoreSession: vi.fn().mockResolvedValue(undefined),
  setError: vi.fn(),
};

export const createMockAuthStore = (
  overrides?: Partial<MockAuthStore>,
): MockAuthStore => ({
  ...defaultAuthStoreState,
  ...overrides,
});