import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as salesApi from '../sales.api';

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

describe('sales.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSales gets /sales/', async () => {
    const sales = [{ id: 1, total: 100 }];
    vi.mocked(mockApi.get).mockResolvedValue({ data: sales });

    const result = await salesApi.getSales();

    expect(mockApi.get).toHaveBeenCalledWith('/sales/');
    expect(result.data).toEqual(sales);
  });

  it('getSale gets /sales/{id}/', async () => {
    const sale = { id: 5, total: 250 };
    vi.mocked(mockApi.get).mockResolvedValue({ data: sale });

    const result = await salesApi.getSale(5);

    expect(mockApi.get).toHaveBeenCalledWith('/sales/5/');
    expect(result.data).toEqual(sale);
  });

  it('createSale posts to /sales/ with data', async () => {
    const payload = { items: [{ product: 1, quantity: 2 }], payment: { method: 'cash', amount: 200 } };
    const created = { id: 1, total: 200, ...payload };
    vi.mocked(mockApi.post).mockResolvedValue({ data: created });

    const result = await salesApi.createSale(payload as any);

    expect(mockApi.post).toHaveBeenCalledWith('/sales/', payload);
    expect(result.data).toEqual(created);
  });

  it('getRecentSales gets /sales/recent/ with default limit', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: [] });

    await salesApi.getRecentSales();

    expect(mockApi.get).toHaveBeenCalledWith('/sales/recent/?limit=10');
  });

  it('getRecentSales uses custom limit', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: [] });

    await salesApi.getRecentSales(5);

    expect(mockApi.get).toHaveBeenCalledWith('/sales/recent/?limit=5');
  });

  it('getSalesHistory gets /sales/history/ with default page and page_size', async () => {
    const history = { count: 0, next: null, previous: null, results: [] };
    vi.mocked(mockApi.get).mockResolvedValue({ data: history });

    const result = await salesApi.getSalesHistory();

    expect(mockApi.get).toHaveBeenCalledWith('/sales/history/?page=1&page_size=15');
    expect(result.data).toEqual(history);
  });

  it('getSalesHistory uses custom page and page_size', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } });

    await salesApi.getSalesHistory(2, 25);

    expect(mockApi.get).toHaveBeenCalledWith('/sales/history/?page=2&page_size=25');
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(salesApi.getSales()).rejects.toThrow('fail');
  });
});
