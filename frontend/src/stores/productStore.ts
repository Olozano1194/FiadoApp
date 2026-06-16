import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import type { Product, ProductFormData } from '../models/product';
import * as productsApi from '../api/products.api';

const extractResults = <T>(data: T[] | { results?: T[] }): T[] =>
  Array.isArray(data) ? data : (data as { results: T[] }).results ?? [];

interface ProductStore {
  products: Product[];
  lowStockProducts: Product[];
  selected: Product | null;
  loading: boolean;
  error: string | null;
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
  error: null,
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await productsApi.getProducts();
      set({ products: extractResults(res.data), loading: false });
    } catch {
      set({ loading: false, error: 'Error al cargar productos' });
    }
  },
  fetchLowStock: async () => {
    try {
      const res = await productsApi.getLowStockProducts();
      set({ lowStockProducts: res.data, error: null });
    } catch {
      set({ error: 'Error al cargar productos con bajo stock' });
      toast.error('Error al cargar productos con bajo stock');
    }
  },
  createProduct: async (data) => {
    try {
      await productsApi.createProduct(data);
      const res = await productsApi.getProducts();
      set({ products: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al crear producto' });
      toast.error('Error al crear producto');
    }
  },
  updateProduct: async (id, data) => {
    try {
      await productsApi.updateProduct(id, data);
      const res = await productsApi.getProducts();
      set({ products: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al actualizar producto' });
      toast.error('Error al actualizar producto');
    }
  },
  deleteProduct: async (id) => {
    try {
      await productsApi.deleteProduct(id);
      const res = await productsApi.getProducts();
      set({ products: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al eliminar producto' });
      toast.error('Error al eliminar producto');
    }
  },
}));
