import api from './axios.config';
import type { Client } from '../models/client';

export const getClients = (debtFilter?: boolean) => {
  const params = debtFilter ? { debt: 'true' } : {};
  return api.get<Client[]>('/clients/', { params });
};
export const getClient = (id: number) => api.get<Client>(`/clients/${id}/`);
export const createClient = (data: Partial<Client>) => api.post<Client>('/clients/', data);
export const updateClient = (id: number, data: Partial<Client>) => api.put<Client>(`/clients/${id}/`, data);
export const deleteClient = (id: number) => api.delete(`/clients/${id}/`);
