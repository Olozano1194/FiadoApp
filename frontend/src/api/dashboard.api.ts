import api from './axios.config';
import type { DashboardStats } from '../models/dashboard';
import type { RecentSale } from '../models/sale';

export const getDashboardStats = () => api.get<DashboardStats>('/dashboard/stats/');
export const getRecentSales = (limit = 5) => api.get<RecentSale[]>(`/sales/recent/?limit=${limit}`);
