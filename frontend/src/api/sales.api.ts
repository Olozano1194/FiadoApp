import api from './axios.config';
import type { Sale, SaleCreatePayload, RecentSale, SaleHistoryItem } from '../models/sale';

export const getSales = () => api.get<Sale[]>('/sales/');
export const getSale = (id: number) => api.get<Sale>(`/sales/${id}/`);
export const createSale = (data: SaleCreatePayload) => api.post<Sale>('/sales/', data);
export const getRecentSales = (limit = 10) => api.get<RecentSale[]>(`/sales/recent/?limit=${limit}`);
export const getSalesHistory = (page = 1, pageSize = 15) =>
  api.get<{ count: number; next: string | null; previous: string | null; results: SaleHistoryItem[] }>(
    `/sales/history/?page=${page}&page_size=${pageSize}`
  );
