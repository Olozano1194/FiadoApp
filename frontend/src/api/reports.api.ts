import api from './axios.config';
import type { ReportStats, RecentActivity } from '../models/report';

export const getReportStats = async (week?: string): Promise<ReportStats> => {
  const params = week ? { week } : {};
  const response = await api.get<ReportStats>('/reports/stats/', { params });
  return response.data;
};

export const getRecentActivity = async (limit: number = 10): Promise<RecentActivity[]> => {
  const response = await api.get<RecentActivity[]>('/reports/recent-activity/', {
    params: { limit },
  });
  return response.data;
};
