export interface DayStats {
  date: string;
  day_name: string;
  total: number;
  count: number;
  profit: number;
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
  total_profit_week: number;
  profit_margin: number;
  total_expenses_week: number;
}

export interface FiadoPending {
  total: number;
  client_count: number;
}

export interface TopProduct {
  name: string;
  units_sold: number;
  revenue: number;
  profit: number;
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