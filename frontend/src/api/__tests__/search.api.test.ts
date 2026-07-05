import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as searchApi from '../search.api';

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

describe('search.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchAll gets /search/ with query param', async () => {
    const results = { products: [{ id: 1, name: 'Coca' }], clients: [] };
    vi.mocked(mockApi.get).mockResolvedValue({ data: results });

    const result = await searchApi.searchAll('Coca');

    expect(mockApi.get).toHaveBeenCalledWith('/search/', { params: { q: 'Coca' } });
    expect(result.data).toEqual(results);
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(searchApi.searchAll('test')).rejects.toThrow('fail');
  });
});
