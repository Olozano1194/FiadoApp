import type { Product } from './product';

export type PaymentMethod = 'CASH' | 'CREDIT';
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface SaleCreatePayload {
  items: { product: number; quantity: number; unit_price: number }[];
  payment_method: 'CASH' | 'CREDIT';
  client?: number | null;
  total: number;
  status?: 'COMPLETED';
}

export interface Sale {
  id: number;
  client?: number | null;
  client_name?: string;
  created_at: string;
  total: string;
  payment_method: PaymentMethod;
  status: SaleStatus;
  notes?: string;
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface RecentSale {
  id: number;
  cliente: string;
  hora: string;
  estado: string;
  total: string;
}

export interface SaleHistoryItem {
  id: number;
  cliente: string;
  fecha: string;
  hora: string;
  metodo_pago: string;
  estado: string;
  total: string;
}
