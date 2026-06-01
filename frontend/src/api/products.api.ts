import api from './axios.config';
import type { Product, ProductFormData } from '../models/product';

const toFormData = (data: ProductFormData | Partial<ProductFormData>): FormData => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (key === 'image') {
      if (value instanceof File) {
        fd.append(key, value, value.name);
      }
      // si es string (URL existente), NO lo mandamos → Django conserva el actual
      return;
    }
    fd.append(key, String(value));
  });
  return fd;
};

export const getProducts = () => api.get<Product[]>('/products/');
export const getProduct = (id: number) => api.get<Product>(`/products/${id}/`);
export const createProduct = (data: ProductFormData) =>
  api.post<Product>('/products/', toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateProduct = (id: number, data: Partial<ProductFormData>) =>
  api.patch<Product>(`/products/${id}/`, toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteProduct = (id: number) => api.delete(`/products/${id}/`);
export const getLowStockProducts = () => api.get<Product[]>('/products/low-stock/');
