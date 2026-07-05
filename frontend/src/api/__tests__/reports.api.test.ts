import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as reportsApi from '../reports.api';

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

describe('reports.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getReportStats gets /reports/stats/ and unwraps data', async () => {
    const stats = { total_sales: 1000, total_expenses: 200, balance: 800 };
    vi.mocked(mockApi.get).mockResolvedValue({ data: stats });

    const result = await reportsApi.getReportStats();

    expect(mockApi.get).toHaveBeenCalledWith('/reports/stats/', { params: {} });
    expect(result).toEqual(stats);
  });

  it('getReportStats sends week param when provided', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: {} });

    await reportsApi.getReportStats('2024-W01');

    expect(mockApi.get).toHaveBeenCalledWith('/reports/stats/', { params: { week: '2024-W01' } });
  });

  it('getRecentActivity gets /reports/recent-activity/ with default limit', async () => {
    const activities = [{ id: 1, description: 'Sale', timestamp: '' }];
    vi.mocked(mockApi.get).mockResolvedValue({ data: activities });

    const result = await reportsApi.getRecentActivity();

    expect(mockApi.get).toHaveBeenCalledWith('/reports/recent-activity/', { params: { limit: 10 } });
    expect(result).toEqual(activities);
  });

  it('getRecentActivity uses custom limit', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: [] });

    await reportsApi.getRecentActivity(5);

    expect(mockApi.get).toHaveBeenCalledWith('/reports/recent-activity/', { params: { limit: 5 } });
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(reportsApi.getReportStats()).rejects.toThrow('fail');
  });
});
