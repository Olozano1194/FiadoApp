import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardStore } from '../dashboardStore';
import * as dashboardApi from '../../api/dashboard.api';

vi.mock('../../api/dashboard.api');

const mockStats = {
  ventas_dia: '500000',
  cambio_vs_ayer: '10.5',
  ganancia_dia: '150000',
  gastos_hoy: '50000',
  margen_dia: 30,
  fiado_pendiente_total: '200000',
  clientes_fiado_pendiente: 5,
  productos_stock_bajo: 3,
};

const mockRecentSale = {
  id: 1,
  cliente: 'Juan Pérez',
  hora: '10:30',
  estado: 'COMPLETED',
  total: '25000',
};

const initialState = {
  stats: null,
  recentSales: [],
  loading: false,
};

describe('dashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState(initialState);
    vi.clearAllMocks();
  });

  // fetchStats
  it('fetchStats: sets loading then stats on success', async () => {
    vi.mocked(dashboardApi.getDashboardStats).mockResolvedValue({
      data: mockStats,
    } as any);

    const promise = useDashboardStore.getState().fetchStats();
    expect(useDashboardStore.getState().loading).toBe(true);

    await promise;
    expect(useDashboardStore.getState().loading).toBe(false);
    expect(useDashboardStore.getState().stats).toEqual(mockStats);
  });

  it('fetchStats: sets loading false on failure (silent)', async () => {
    vi.mocked(dashboardApi.getDashboardStats).mockRejectedValue(new Error('fail'));

    await useDashboardStore.getState().fetchStats();
    expect(useDashboardStore.getState().loading).toBe(false);
    // Dashboard store silently handles errors — stats remains null
    expect(useDashboardStore.getState().stats).toBeNull();
  });

  // fetchRecentSales
  it('fetchRecentSales: sets recentSales on success', async () => {
    vi.mocked(dashboardApi.getRecentSales).mockResolvedValue({
      data: [mockRecentSale],
    } as any);

    await useDashboardStore.getState().fetchRecentSales();
    expect(useDashboardStore.getState().recentSales).toEqual([mockRecentSale]);
  });

  it('fetchRecentSales: silently handles errors', async () => {
    vi.mocked(dashboardApi.getRecentSales).mockRejectedValue(new Error('fail'));

    await useDashboardStore.getState().fetchRecentSales();
    expect(useDashboardStore.getState().recentSales).toEqual([]);
  });

  it('fetchRecentSales: passes limit parameter', async () => {
    vi.mocked(dashboardApi.getRecentSales).mockResolvedValue({
      data: [mockRecentSale],
    } as any);

    await useDashboardStore.getState().fetchRecentSales(10);
    expect(dashboardApi.getRecentSales).toHaveBeenCalledWith(10);
  });
});
