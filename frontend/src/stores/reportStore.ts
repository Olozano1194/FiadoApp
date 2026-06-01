import { create } from 'zustand';
import type { ReportStats, DayStats, RecentActivity, PeriodType } from '../models/report';
import * as reportsApi from '../api/reports.api';

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

interface ReportState {
  stats: ReportStats | null;
  recentActivity: RecentActivity[];
  selectedDay: DayStats | null;
  period: PeriodType;
  weekStart: string;
  loading: boolean;
  error: string | null;

  fetchStats: (date?: string) => Promise<void>;
  fetchRecentActivity: (limit?: number) => Promise<void>;
  setPeriod: (period: PeriodType) => void;
  setSelectedDay: (day: DayStats | null) => void;
  navigateWeek: (direction: 1 | -1) => void;
  reset: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  stats: null,
  recentActivity: [],
  selectedDay: null,
  period: 'week',
  weekStart: getMonday(new Date()),
  loading: false,
  error: null,

  fetchStats: async (date?: string) => {
    set({ loading: true, error: null });
    try {
      const weekDate = date || get().weekStart;
      const data = await reportsApi.getReportStats(weekDate);
      set({ stats: data, weekStart: weekDate, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Error al cargar estadísticas',
      });
    }
  },

  fetchRecentActivity: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getRecentActivity(limit);
      set({ recentActivity: data, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Error al cargar actividad reciente',
      });
    }
  },

  setPeriod: (period: PeriodType) => {
    set({ period, selectedDay: null });
    get().fetchStats();
  },

  setSelectedDay: (day: DayStats | null) => {
    set({ selectedDay: day });
  },

  navigateWeek: (direction: 1 | -1) => {
    const { weekStart } = get();
    const d = new Date(weekStart);
    d.setDate(d.getDate() + direction * 7);
    const newWeekStart = d.toISOString().split('T')[0];
    set({ weekStart: newWeekStart, selectedDay: null });
    get().fetchStats(newWeekStart);
  },

  reset: () => {
    set({
      stats: null,
      recentActivity: [],
      selectedDay: null,
      period: 'week',
      weekStart: getMonday(new Date()),
      loading: false,
      error: null,
    });
  },
}));
