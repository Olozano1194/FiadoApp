import api from './axios.config';
import type { Product, ProductFormData } from '../models/product';

export const getProducts = () => api.get<Product[]>('/products/');
export const getProduct = (id: number) => api.get<Product>(`/products/${id}/`);
export const createProduct = (data: ProductFormData) => api.post<Product>('/products/', data);
export const updateProduct = (id: number, data: Partial<ProductFormData>) => api.put<Product>(`/products/${id}/`, data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}/`);
export const getLowStockProducts = () => api.get<Product[]>('/products/low-stock/');
