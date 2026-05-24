import api from './axios.config';
import type { Sale, SaleCreatePayload, RecentSale } from '../models/sale';

export const getSales = () => api.get<Sale[]>('/sales/');
export const getSale = (id: number) => api.get<Sale>(`/sales/${id}/`);
export const createSale = (data: SaleCreatePayload) => api.post<Sale>('/sales/', data);
export const getRecentSales = (limit = 10) => api.get<RecentSale[]>(`/sales/recent/?limit=${limit}`);
