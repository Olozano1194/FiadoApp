import { create } from 'zustand';
import type { RecentSale, Sale, CartItem, SaleCreatePayload } from '../models/sale';
import type { Client } from '../models/client';
import type { Product } from '../models/product';
import * as salesApi from '../api/sales.api';

interface SaleStore {
  sales: Sale[];
  recentSales: RecentSale[];
  loading: boolean;
  cart: CartItem[];
  selectedPaymentMethod: 'CASH' | 'CREDIT';
  selectedClient: Client | null;
  isSubmitting: boolean;
  lastSale: Sale | null;
  error: string | null;
  fetchSales: () => Promise<void>;
  fetchRecentSales: (limit?: number) => Promise<void>;
  createSale: (data: Partial<Sale>) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setPaymentMethod: (method: 'CASH' | 'CREDIT') => void;
  setSelectedClient: (client: Client | null) => void;
  completeSale: () => Promise<void>;
  getCartTotal: () => number;
}

export const useSaleStore = create<SaleStore>((set, get) => ({
  sales: [],
  recentSales: [],
  loading: false,
  cart: [],
  selectedPaymentMethod: 'CASH',
  selectedClient: null,
  isSubmitting: false,
  lastSale: null,
  error: null,
  fetchSales: async () => {
    set({ loading: true });
    try {
      const res = await salesApi.getSales();
      set({ sales: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchRecentSales: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await salesApi.getRecentSales(limit);
      set({ recentSales: res.data, loading: false });
    } catch {
      set({ loading: false, error: 'Error al cargar ventas recientes' });
    }
  },
  createSale: async (data) => {
    try {
      await salesApi.createSale(data as unknown as SaleCreatePayload);
      const res = await salesApi.getSales();
      set({ sales: res.data });
    } catch { /* handled by interceptor */ }
  },
  addToCart: (product) => {
    const { cart } = get();
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      const newQty = existing.quantity + 1;
      set({
        cart: cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, subtotal: newQty * parseFloat(item.product.price) }
            : item
        ),
      });
    } else {
      set({ cart: [...cart, { product, quantity: 1, subtotal: parseFloat(product.price) }] });
    }
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(item => item.product.id !== productId) });
  },
  updateQuantity: (productId, quantity) => {
    const newQty = Math.max(1, quantity);
    set({
      cart: get().cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQty, subtotal: newQty * parseFloat(item.product.price) }
          : item
      ),
    });
  },
  clearCart: () => {
    set({ cart: [], selectedPaymentMethod: 'CASH', selectedClient: null, lastSale: null, error: null });
  },
  setPaymentMethod: (method) => {
    set({ selectedPaymentMethod: method });
  },
  setSelectedClient: (client) => {
    set({ selectedClient: client });
  },
  completeSale: async () => {
    const state = get();
    if (state.cart.length === 0) return;
    set({ isSubmitting: true, error: null });
    try {
      const payload: SaleCreatePayload = {
        items: state.cart.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.product.price),
        })),
        payment_method: state.selectedPaymentMethod,
        client: state.selectedClient?.id ?? null,
        total: state.cart.reduce((sum, item) => sum + item.subtotal, 0),
        status: 'COMPLETED',
      };
      const res = await salesApi.createSale(payload);
      set({ lastSale: res.data, isSubmitting: false, cart: [], selectedClient: null, selectedPaymentMethod: 'CASH' });
    } catch {
      set({ isSubmitting: false, error: 'Error al procesar la venta' });
    }
  },
  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.subtotal, 0);
  },
}));