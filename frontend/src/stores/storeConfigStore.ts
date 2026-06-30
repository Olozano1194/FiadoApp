import { create } from 'zustand';
import { getStoreConfig, updateStoreConfig, type StoreConfig } from '../api/settings.api';

interface StoreConfigState {
  config: StoreConfig | null;
  loading: boolean;
  error: string | null;
  _fetched: boolean;
  fetchConfig: () => Promise<void>;
  updateName: (store_name: string) => Promise<void>;
}

export const useStoreConfig = create<StoreConfigState>((set, get) => ({
  config: null,
  loading: false,
  error: null,
  _fetched: false,

  fetchConfig: async () => {
    if (get()._fetched) return;
    set({ loading: true, error: null });
    try {
      const config = await getStoreConfig();
      set({ config, loading: false, _fetched: true });
    } catch {
      set({ error: 'Error al cargar configuración', loading: false, _fetched: true });
    }
  },

  updateName: async (store_name: string) => {
    set({ loading: true, error: null });
    try {
      const config = await updateStoreConfig({ store_name });
      set({ config, loading: false });
    } catch {
      set({ error: 'Error al actualizar nombre', loading: false });
    }
  },
}));