import { create } from 'zustand';
import type { Product, ProductFormData } from '../models/product';
import * as productsApi from '../api/products.api';

interface ProductStore {
  products: Product[];
  lowStockProducts: Product[];
  selected: Product | null;
  loading: boolean;
  fetchProducts: () => Promise<void>;
  fetchLowStock: () => Promise<void>;
  createProduct: (data: ProductFormData) => Promise<void>;
  updateProduct: (id: number, data: Partial<ProductFormData>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  lowStockProducts: [],
  selected: null,
  loading: false,
  fetchProducts: async () => {
    set({ loading: true });
    try {
      const res = await productsApi.getProducts();
      set({ products: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchLowStock: async () => {
    try {
      const res = await productsApi.getLowStockProducts();
      set({ lowStockProducts: res.data });
    } catch {
      // silently fail — data stays as empty array
    }
  },
  createProduct: async (data) => {
    try {
      await productsApi.createProduct(data);
      const res = await productsApi.getProducts();
      set({ products: res.data });
    } catch {
      // error handled by interceptor
    }
  },
  updateProduct: async (id, data) => {
    try {
      await productsApi.updateProduct(id, data);
      const res = await productsApi.getProducts();
      set({ products: res.data });
    } catch {
      // error handled by interceptor
    }
  },
  deleteProduct: async (id) => {
    try {
      await productsApi.deleteProduct(id);
      const res = await productsApi.getProducts();
      set({ products: res.data });
    } catch {
      // error handled by interceptor
    }
  },
}));
