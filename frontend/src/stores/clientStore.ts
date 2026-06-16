import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import type { Client } from '../models/client';
import * as clientsApi from '../api/clients.api';

const extractResults = <T>(data: T[] | { results?: T[] }): T[] =>
  Array.isArray(data) ? data : (data as { results: T[] }).results ?? [];

interface ClientStore {
  clients: Client[];
  debtors: Client[];
  selected: Client | null;
  loading: boolean;
  error: string | null;
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
  error: null,
  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const res = await clientsApi.getClients();
      set({ clients: extractResults(res.data), loading: false });
    } catch {
      set({ loading: false, error: 'Error al cargar clientes' });
    }
  },
  fetchDebtors: async () => {
    try {
      const res = await clientsApi.getClients(true);
      set({ debtors: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al cargar deudores' });
      toast.error('Error al cargar deudores');
    }
  },
  createClient: async (data) => {
    try {
      await clientsApi.createClient(data);
      const res = await clientsApi.getClients();
      set({ clients: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al crear cliente' });
      toast.error('Error al crear cliente');
    }
  },
  updateClient: async (id, data) => {
    try {
      await clientsApi.updateClient(id, data);
      const res = await clientsApi.getClients();
      set({ clients: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al actualizar cliente' });
      toast.error('Error al actualizar cliente');
    }
  },
  deleteClient: async (id) => {
    try {
      await clientsApi.deleteClient(id);
      const res = await clientsApi.getClients();
      set({ clients: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al eliminar cliente' });
      toast.error('Error al eliminar cliente');
    }
  },
}));
