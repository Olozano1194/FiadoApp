import api from './axios.config';
import type { CashClosure, CashClosurePreview, CreateClosurePayload } from '../models/cash-closure';

export const getPreview = async (date?: string): Promise<CashClosurePreview> => {
  const params = date ? { date } : {};
  const response = await api.get<CashClosurePreview>('/cash-closures/preview/', { params });
  return response.data;
};

export const createClosure = async (payload: CreateClosurePayload): Promise<CashClosure> => {
  const response = await api.post<CashClosure>('/cash-closures/', payload);
  return response.data;
};

export const listClosures = async (): Promise<CashClosure[]> => {
  const response = await api.get<CashClosure[]>('/cash-closures/');
  return response.data;
};

export const getClosure = async (id: number): Promise<CashClosure> => {
  const response = await api.get<CashClosure>(`/cash-closures/${id}/`);
  return response.data;
};
