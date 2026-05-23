import { create } from 'zustand';
import type { RecentSale, Sale } from '../models/sale';
import * as salesApi from '../api/sales.api';

interface SaleStore {
  sales: Sale[];
  recentSales: RecentSale[];
  loading: boolean;
  fetchSales: () => Promise<void>;
  fetchRecentSales: (limit?: number) => Promise<void>;
  createSale: (data: Partial<Sale>) => Promise<void>;
}

export const useSaleStore = create<SaleStore>((set) => ({
  sales: [],
  recentSales: [],
  loading: false,
  fetchSales: async () => {
    set({ loading: true });
    try {
      const res = await salesApi.getSales();
      set({ sales: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchRecentSales: async (limit = 10) => {
    try {
      const res = await salesApi.getRecentSales(limit);
      set({ recentSales: res.data });
    } catch { /* silent */ }
  },
  createSale: async (data) => {
    try {
      await salesApi.createSale(data);
      const res = await salesApi.getSales();
      set({ sales: res.data });
    } catch { /* handled by interceptor */ }
  },
}));
