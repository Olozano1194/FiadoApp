import api from './axios.config';
import type { Category } from '../models/category';

export const getCategories = () => api.get<Category[]>('/categories/');
export const createCategory = (data: Partial<Category>) => api.post<Category>('/categories/', data);
