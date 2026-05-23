export interface FiadoPayment {
  id: number;
  client?: number;
  sale?: number | null;
  amount: string;
  date: string;
  notes?: string;
}
