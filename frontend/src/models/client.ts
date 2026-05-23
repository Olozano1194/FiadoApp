export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_limit: string;
  current_debt: string;
  created_at: string;
}
