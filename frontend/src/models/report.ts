export interface DayStats {
  date: string;
  day_name: string;
  total: number;
  count: number;
  top_product: {
    name: string;
    units: number;
    revenue: number;
  } | null;
}

export interface WeekSummary {
  total_week: number;
  change_vs_last_week: number;
  avg_per_day: number;
}

export interface FiadoPending {
  total: number;
  client_count: number;
}

export interface TopProduct {
  name: string;
  units_sold: number;
  revenue: number;
  image?: string;
}

export interface ReportStats {
  week_days: DayStats[];
  summary: WeekSummary;
  fiado_pending: FiadoPending;
  top_product: TopProduct;
}

export interface RecentActivity {
  id: number;
  concept: string;
  client_name: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  time: string;
}

export type PeriodType = 'week' | 'month';
