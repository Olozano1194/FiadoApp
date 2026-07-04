import { vi } from 'vitest';
import type { Sale, RecentSale, CartItem } from '../../models/sale';
import type { Client } from '../../models/client';

export interface MockSaleStore {
  sales: Sale[];
  recentSales: RecentSale[];
  loading: boolean;
  cart: CartItem[];
  selectedPaymentMethod: 'CASH' | 'CREDIT';
  selectedClient: Client | null;
  isSubmitting: boolean;
  lastSale: Sale | null;
  error: string | null;
  cashReceived: number;
  change: number;
  fetchSales: ReturnType<typeof vi.fn>;
  fetchRecentSales: ReturnType<typeof vi.fn>;
  createSale: ReturnType<typeof vi.fn>;
  addToCart: ReturnType<typeof vi.fn>;
  removeFromCart: ReturnType<typeof vi.fn>;
  updateQuantity: ReturnType<typeof vi.fn>;
  clearCart: ReturnType<typeof vi.fn>;
  setPaymentMethod: ReturnType<typeof vi.fn>;
  setSelectedClient: ReturnType<typeof vi.fn>;
  setCashReceived: ReturnType<typeof vi.fn>;
  completeSale: ReturnType<typeof vi.fn>;
  getCartTotal: ReturnType<typeof vi.fn>;
}

export const defaultSaleStoreState: MockSaleStore = {
  sales: [],
  recentSales: [],
  loading: false,
  cart: [],
  selectedPaymentMethod: 'CASH',
  selectedClient: null,
  isSubmitting: false,
  lastSale: null,
  error: null,
  cashReceived: 0,
  change: 0,
  fetchSales: vi.fn().mockResolvedValue(undefined),
  fetchRecentSales: vi.fn().mockResolvedValue(undefined),
  createSale: vi.fn().mockResolvedValue(undefined),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  setPaymentMethod: vi.fn(),
  setSelectedClient: vi.fn(),
  setCashReceived: vi.fn(),
  completeSale: vi.fn().mockResolvedValue(undefined),
  getCartTotal: vi.fn(() => 0),
};

export const createMockSaleStore = (
  overrides?: Partial<MockSaleStore>,
): MockSaleStore => ({
  ...defaultSaleStoreState,
  ...overrides,
});