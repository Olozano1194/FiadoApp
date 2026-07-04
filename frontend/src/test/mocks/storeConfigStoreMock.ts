import { vi } from 'vitest';
import type { StoreConfig } from '../../api/settings.api';

export interface MockStoreConfigState {
  config: StoreConfig | null;
  loading: boolean;
  error: string | null;
  _fetched: boolean;
  fetchConfig: ReturnType<typeof vi.fn>;
  updateName: ReturnType<typeof vi.fn>;
}

export const defaultStoreConfigState: MockStoreConfigState = {
  config: null,
  loading: false,
  error: null,
  _fetched: false,
  fetchConfig: vi.fn().mockResolvedValue(undefined),
  updateName: vi.fn().mockResolvedValue(undefined),
};

export const createMockStoreConfigStore = (
  overrides?: Partial<MockStoreConfigState>,
): MockStoreConfigState => ({
  ...defaultStoreConfigState,
  ...overrides,
});