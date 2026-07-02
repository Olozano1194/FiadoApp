import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dashboardApi from '../dashboard.api';

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

describe('dashboard.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDashboardStats gets /dashboard/stats/', async () => {
    const stats = { total_sales: 100, total_clients: 20, total_debt: 500 };
    vi.mocked(mockApi.get).mockResolvedValue({ data: stats });

    const result = await dashboardApi.getDashboardStats();

    expect(mockApi.get).toHaveBeenCalledWith('/dashboard/stats/');
    expect(result.data).toEqual(stats);
  });

  it('getRecentSales gets /sales/recent/ with default limit', async () => {
    const sales = [{ id: 1, total: 100 }];
    vi.mocked(mockApi.get).mockResolvedValue({ data: sales });

    const result = await dashboardApi.getRecentSales();

    expect(mockApi.get).toHaveBeenCalledWith('/sales/recent/?limit=5');
    expect(result.data).toEqual(sales);
  });

  it('getRecentSales uses custom limit', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: [] });

    await dashboardApi.getRecentSales(10);

    expect(mockApi.get).toHaveBeenCalledWith('/sales/recent/?limit=10');
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(dashboardApi.getDashboardStats()).rejects.toThrow('fail');
  });
});
