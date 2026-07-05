import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fiadoPaymentsApi from '../fiado-payments.api';

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

describe('fiado-payments.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPayments gets /fiado-payments/', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: [] });

    await fiadoPaymentsApi.getPayments();

    expect(mockApi.get).toHaveBeenCalledWith('/fiado-payments/', { params: {} });
  });

  it('getPayments sends client param when clientId provided', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: [] });

    await fiadoPaymentsApi.getPayments(5);

    expect(mockApi.get).toHaveBeenCalledWith('/fiado-payments/', { params: { client: 5 } });
  });

  it('createPayment posts to /fiado-payments/ with data', async () => {
    const paymentData = { client: 1, amount: '500', notes: 'abono' };
    const created = { id: 1, ...paymentData, created_at: '' };
    vi.mocked(mockApi.post).mockResolvedValue({ data: created });

    const result = await fiadoPaymentsApi.createPayment(paymentData);

    expect(mockApi.post).toHaveBeenCalledWith('/fiado-payments/', paymentData);
    expect(result.data).toEqual(created);
  });

  it('getTodayPayments gets /fiado-payments/today/', async () => {
    const today = { total: '1500', count: 3 };
    vi.mocked(mockApi.get).mockResolvedValue({ data: today });

    const result = await fiadoPaymentsApi.getTodayPayments();

    expect(mockApi.get).toHaveBeenCalledWith('/fiado-payments/today/');
    expect(result.data).toEqual(today);
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(fiadoPaymentsApi.getPayments()).rejects.toThrow('fail');
  });
});
