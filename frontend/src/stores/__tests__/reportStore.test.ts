import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReportStore } from '../reportStore';
import * as reportsApi from '../../api/reports.api';

vi.mock('../../api/reports.api');

const mockStats = {
  week_days: [],
  summary: {
    total_week: 500000,
    change_vs_last_week: 10,
    avg_per_day: 71428,
    total_profit_week: 150000,
    profit_margin: 30,
    total_expenses_week: 50000,
  },
  fiado_pending: { total: 200000, client_count: 5 },
  top_product: { name: 'Product A', units_sold: 10, revenue: 100000, profit: 30000 },
};

const mockActivity = [
  { id: 1, concept: 'Venta #123', client_name: 'Juan', type: 'sale', amount: 25000, status: 'completed', date: '2024-06-15', time: '10:30' },
];

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

const initialState = {
  stats: null,
  recentActivity: [],
  selectedDay: null,
  period: 'week' as const,
  weekStart: getMonday(new Date()),
  loading: false,
  error: null,
};

describe('reportStore', () => {
  beforeEach(() => {
    useReportStore.setState(initialState);
    vi.clearAllMocks();
  });

  // fetchStats
  it('fetchStats: sets loading then stats on success', async () => {
    vi.mocked(reportsApi.getReportStats).mockResolvedValue(mockStats);

    const promise = useReportStore.getState().fetchStats('2024-06-10');
    expect(useReportStore.getState().loading).toBe(true);

    await promise;
    expect(useReportStore.getState().loading).toBe(false);
    expect(useReportStore.getState().stats).toEqual(mockStats);
    expect(useReportStore.getState().weekStart).toBe('2024-06-10');
  });

  it('fetchStats: uses current weekStart when no date provided', async () => {
    vi.mocked(reportsApi.getReportStats).mockResolvedValue(mockStats);

    await useReportStore.getState().fetchStats();
    expect(reportsApi.getReportStats).toHaveBeenCalledWith(initialState.weekStart);
  });

  it('fetchStats: sets error on failure', async () => {
    vi.mocked(reportsApi.getReportStats).mockRejectedValue(new Error('Error al cargar estadísticas'));

    await useReportStore.getState().fetchStats('2024-06-10');
    expect(useReportStore.getState().loading).toBe(false);
    expect(useReportStore.getState().error).toBe('Error al cargar estadísticas');
  });

  // fetchRecentActivity
  it('fetchRecentActivity: sets loading then activity on success', async () => {
    vi.mocked(reportsApi.getRecentActivity).mockResolvedValue(mockActivity);

    const promise = useReportStore.getState().fetchRecentActivity();
    expect(useReportStore.getState().loading).toBe(true);

    await promise;
    expect(useReportStore.getState().loading).toBe(false);
    expect(useReportStore.getState().recentActivity).toEqual(mockActivity);
  });

  it('fetchRecentActivity: sets error on failure', async () => {
    vi.mocked(reportsApi.getRecentActivity).mockRejectedValue(new Error('Error al cargar actividad reciente'));

    await useReportStore.getState().fetchRecentActivity(5);
    expect(useReportStore.getState().loading).toBe(false);
    expect(useReportStore.getState().error).toBe('Error al cargar actividad reciente');
  });

  // Non-async actions
  it('setPeriod: updates period and triggers fetchStats', async () => {
    vi.mocked(reportsApi.getReportStats).mockResolvedValue(mockStats);

    useReportStore.getState().setPeriod('month');

    expect(useReportStore.getState().period).toBe('month');
    expect(useReportStore.getState().selectedDay).toBeNull();
    expect(reportsApi.getReportStats).toHaveBeenCalled();
  });

  it('setSelectedDay: updates selectedDay', () => {
    const day = { date: '2024-06-15', day_name: 'Sábado', total: 100000, count: 5, profit: 30000, top_product: null };

    useReportStore.getState().setSelectedDay(day);
    expect(useReportStore.getState().selectedDay).toEqual(day);

    useReportStore.getState().setSelectedDay(null);
    expect(useReportStore.getState().selectedDay).toBeNull();
  });

  it('navigateWeek: advances forward and backward', async () => {
    vi.mocked(reportsApi.getReportStats).mockResolvedValue(mockStats);

    useReportStore.setState({ weekStart: '2024-06-10' });

    useReportStore.getState().navigateWeek(1);
    expect(useReportStore.getState().weekStart).toBe('2024-06-17');
    expect(useReportStore.getState().selectedDay).toBeNull();

    useReportStore.getState().navigateWeek(-1);
    expect(useReportStore.getState().weekStart).toBe('2024-06-10');
  });

  it('reset: clears state to initial values', () => {
    useReportStore.setState({
      stats: mockStats,
      recentActivity: mockActivity,
      selectedDay: { date: '2024-06-15', day_name: 'Sábado', total: 100000, count: 5, profit: 30000, top_product: null },
      period: 'month',
      loading: true,
      error: 'some error',
    });

    useReportStore.getState().reset();

    const s = useReportStore.getState();
    expect(s.stats).toBeNull();
    expect(s.recentActivity).toEqual([]);
    expect(s.selectedDay).toBeNull();
    expect(s.period).toBe('week');
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });
});
