import { create } from 'zustand';
import type { CashClosurePreview } from '../models/cash-closure';
import * as cashClosureApi from '../api/cash-closure.api';

interface ClosureStore {
  preview: CashClosurePreview | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  isAlreadyClosed: boolean;

  fetchPreview: () => Promise<void>;
  createClosure: (countedCash: number, notes?: string) => Promise<void>;
  reset: () => void;
}

export const useClosureStore = create<ClosureStore>((set) => ({
  preview: null,
  loading: false,
  creating: false,
  error: null,
  isAlreadyClosed: false,

  fetchPreview: async () => {
    set({ loading: true, error: null });
    try {
      const data = await cashClosureApi.getPreview();
      set({ preview: data, isAlreadyClosed: data?.already_closed ?? false, loading: false });
    } catch (err: unknown) {
      let message = 'Error al cargar previsualización';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
        message = axiosErr.response?.data?.detail || message;
      }
      set({ loading: false, error: message });
    }
  },

  createClosure: async (countedCash: number, notes?: string) => {
    set({ creating: true, error: null });
    try {
      await cashClosureApi.createClosure({ counted_cash: countedCash, notes });
      set({ creating: false });
    } catch (err: unknown) {
      let message = 'Error al registrar cierre';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
        message = axiosErr.response?.data?.detail || message;
      }
      set({ creating: false, error: message });
      throw err;
    }
  },

  reset: () => {
    set({ preview: null, loading: false, creating: false, error: null, isAlreadyClosed: false });
  },
}));
