import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as cashClosureApi from '../cash-closure.api';

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

describe('cash-closure.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPreview gets /cash-closures/preview/ and unwraps data', async () => {
    const preview = { total_cash: 1000, total_transfer: 500, total_sales: 1500 };
    vi.mocked(mockApi.get).mockResolvedValue({ data: preview });

    const result = await cashClosureApi.getPreview();

    expect(mockApi.get).toHaveBeenCalledWith('/cash-closures/preview/');
    expect(result).toEqual(preview);
  });

  it('createClosure posts to /cash-closures/ with data and unwraps', async () => {
    const payload = { total_cash: 1000, total_transfer: 500, notes: 'cierre diario' };
    const closure = { id: 1, ...payload, created_at: '2024-01-01T00:00:00Z' };
    vi.mocked(mockApi.post).mockResolvedValue({ data: closure });

    const result = await cashClosureApi.createClosure(payload as any);

    expect(mockApi.post).toHaveBeenCalledWith('/cash-closures/', payload);
    expect(result).toEqual(closure);
  });

  it('listClosures gets /cash-closures/ with params and unwraps results', async () => {
    const results = [{ id: 1, total_cash: 1000, total_transfer: 500, notes: '', created_at: '' }];
    vi.mocked(mockApi.get).mockResolvedValue({ data: { results } });

    const result = await cashClosureApi.listClosures({ page: 2 });

    expect(mockApi.get).toHaveBeenCalledWith('/cash-closures/', { params: { page: 2 } });
    expect(result).toEqual(results);
  });

  it('listClosures works without params', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: { results: [] } });

    await cashClosureApi.listClosures();

    expect(mockApi.get).toHaveBeenCalledWith('/cash-closures/', { params: undefined });
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(cashClosureApi.getPreview()).rejects.toThrow('fail');
  });

  it('propagates error on create failure', async () => {
    vi.mocked(mockApi.post).mockRejectedValue(new Error('fail'));

    await expect(cashClosureApi.createClosure({} as any)).rejects.toThrow('fail');
  });
});
