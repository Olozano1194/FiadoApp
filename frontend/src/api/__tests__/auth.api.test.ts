import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authApi from '../auth.api';

vi.mock('../axios.config', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../axios.config';
const mockApi = vi.mocked(api);

describe('auth.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login posts to /token/ with credentials', async () => {
    const credentials = { username: 'admin', password: '123' };
    const mockResponse = { data: { access: 'abc', refresh: 'def' } };
    vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

    const result = await authApi.login(credentials);

    expect(mockApi.post).toHaveBeenCalledWith('/token/', credentials);
    expect(result.data).toEqual(mockResponse.data);
  });

  it('refresh posts to /token/refresh/ with refresh token', async () => {
    const mockResponse = { data: { access: 'new-access', refresh: 'new-refresh' } };
    vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

    const result = await authApi.refresh('refresh-token');

    expect(mockApi.post).toHaveBeenCalledWith('/token/refresh/', { refresh: 'refresh-token' });
    expect(result.data).toEqual(mockResponse.data);
  });

  it('verify posts to /token/verify/ with token', async () => {
    vi.mocked(mockApi.post).mockResolvedValue({ data: {} });

    await authApi.verify('some-token');

    expect(mockApi.post).toHaveBeenCalledWith('/token/verify/', { token: 'some-token' });
  });

  it('propagates error on failure', async () => {
    const error = new Error('Network error');
    vi.mocked(mockApi.post).mockRejectedValue(error);

    await expect(authApi.login({ username: 'x', password: 'y' })).rejects.toThrow('Network error');
  });
});
