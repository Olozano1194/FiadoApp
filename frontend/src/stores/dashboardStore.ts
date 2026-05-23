import { create } from 'zustand';
import type { DashboardStats } from '../models/dashboard';
import type { RecentSale } from '../models/sale';
import * as dashboardApi from '../api/dashboard.api';

interface DashboardStore {
  stats: DashboardStats | null;
  recentSales: RecentSale[];
  loading: boolean;
  fetchStats: () => Promise<void>;
  fetchRecentSales: (limit?: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  recentSales: [],
  loading: false,
  fetchStats: async () => {
    set({ loading: true });
    try {
      const res = await dashboardApi.getDashboardStats();
      set({ stats: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchRecentSales: async (limit = 5) => {
    try {
      const res = await dashboardApi.getRecentSales(limit);
      set({ recentSales: res.data });
    } catch { /* silent */ }
  },
}));
