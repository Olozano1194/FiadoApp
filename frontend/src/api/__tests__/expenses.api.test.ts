import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as expensesApi from '../expenses.api';

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

describe('expenses.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getExpenses gets /expenses/', async () => {
    const paginated = { count: 0, next: null, previous: null, results: [] };
    vi.mocked(mockApi.get).mockResolvedValue({ data: paginated });

    const result = await expensesApi.getExpenses();

    expect(mockApi.get).toHaveBeenCalledWith('/expenses/', { params: undefined });
    expect(result.data).toEqual(paginated);
  });

  it('getExpenses sends date filters', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } });

    await expensesApi.getExpenses({ date_from: '2024-01-01', date_to: '2024-01-31' });

    expect(mockApi.get).toHaveBeenCalledWith('/expenses/', {
      params: { date_from: '2024-01-01', date_to: '2024-01-31' },
    });
  });

  it('getExpense gets /expenses/{id}/', async () => {
    const expense = { id: 3, description: 'Test', amount: '500', date: '2024-01-01' };
    vi.mocked(mockApi.get).mockResolvedValue({ data: expense });

    const result = await expensesApi.getExpense(3);

    expect(mockApi.get).toHaveBeenCalledWith('/expenses/3/');
    expect(result.data).toEqual(expense);
  });

  it('createExpense posts to /expenses/ with data', async () => {
    const data = { description: 'New', amount: '100', date: '2024-01-15' };
    const created = { id: 4, ...data };
    vi.mocked(mockApi.post).mockResolvedValue({ data: created });

    const result = await expensesApi.createExpense(data as any);

    expect(mockApi.post).toHaveBeenCalledWith('/expenses/', data);
    expect(result.data).toEqual(created);
  });

  it('updateExpense patches /expenses/{id}/ with data', async () => {
    const data = { amount: '200' };
    vi.mocked(mockApi.patch).mockResolvedValue({ data: { id: 1, description: 'Test', amount: '200', date: '2024-01-01' } });

    const result = await expensesApi.updateExpense(1, data);

    expect(mockApi.patch).toHaveBeenCalledWith('/expenses/1/', data);
    expect(result.data.amount).toBe('200');
  });

  it('deleteExpense deletes /expenses/{id}/', async () => {
    vi.mocked(mockApi.delete).mockResolvedValue({ data: {} });

    await expensesApi.deleteExpense(2);

    expect(mockApi.delete).toHaveBeenCalledWith('/expenses/2/');
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(expensesApi.getExpenses()).rejects.toThrow('fail');
  });
});
