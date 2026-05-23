import { create } from 'zustand';
import type { Client } from '../models/client';
import * as clientsApi from '../api/clients.api';

interface ClientStore {
  clients: Client[];
  debtors: Client[];
  selected: Client | null;
  loading: boolean;
  fetchClients: () => Promise<void>;
  fetchDebtors: () => Promise<void>;
  createClient: (data: Partial<Client>) => Promise<void>;
  updateClient: (id: number, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  debtors: [],
  selected: null,
  loading: false,
  fetchClients: async () => {
    set({ loading: true });
    try {
      const res = await clientsApi.getClients();
      set({ clients: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchDebtors: async () => {
    try {
      const res = await clientsApi.getClients(true);
      set({ debtors: res.data });
    } catch { /* silent */ }
  },
  createClient: async (data) => {
    try {
      await clientsApi.createClient(data);
      const res = await clientsApi.getClients();
      set({ clients: res.data });
    } catch { /* handled by interceptor */ }
  },
  updateClient: async (id, data) => {
    try {
      await clientsApi.updateClient(id, data);
      const res = await clientsApi.getClients();
      set({ clients: res.data });
    } catch { /* handled by interceptor */ }
  },
  deleteClient: async (id) => {
    try {
      await clientsApi.deleteClient(id);
      const res = await clientsApi.getClients();
      set({ clients: res.data });
    } catch { /* handled by interceptor */ }
  },
}));
