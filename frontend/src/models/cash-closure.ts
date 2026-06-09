export interface CashClosure {
  id: number;
  date: string;
  total_sales: string;
  cash_sales: string;
  credit_sales: string;
  sales_count: number;
  fiado_payments: string;
  expenses: string;
  net_profit: string;
  expected_cash: string;
  counted_cash: string;
  discrepancy: string;
  notes: string;
  created_by: number;
  created_at: string;
}

export interface CashClosurePreview {
  date: string;
  total_sales: string;
  cash_sales: string;
  credit_sales: string;
  sales_count: number;
  fiado_payments: string;
  expenses: string;
  net_profit: string;
  expected_cash: string;
}

export interface CreateClosurePayload {
  counted_cash: number;
  notes?: string;
}
