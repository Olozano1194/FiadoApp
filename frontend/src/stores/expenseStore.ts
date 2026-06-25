import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import type { Expense, ExpenseFormData } from '../models/expense';
import * as expensesApi from '../api/expenses.api';

const extractResults = <T>(data: T[] | { results?: T[] }): T[] =>
  Array.isArray(data) ? data : (data as { results: T[] }).results ?? [];

interface ExpenseStore {
  expenses: Expense[];
  selected: Expense | null;
  loading: boolean;
  error: string | null;
  fetchExpenses: (params?: { date_from?: string; date_to?: string }) => Promise<void>;
  createExpense: (data: ExpenseFormData) => Promise<void>;
  updateExpense: (id: number, data: Partial<ExpenseFormData>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  selected: null,
  loading: false,
  error: null,
  fetchExpenses: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await expensesApi.getExpenses(params);
      set({ expenses: extractResults(res.data), loading: false });
    } catch {
      set({ loading: false, error: 'Error al cargar gastos' });
    }
  },
  createExpense: async (data) => {
    try {
      await expensesApi.createExpense(data);
      const res = await expensesApi.getExpenses();
      set({ expenses: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al crear gasto' });
      toast.error('Error al crear gasto');
    }
  },
  updateExpense: async (id, data) => {
    try {
      await expensesApi.updateExpense(id, data);
      const res = await expensesApi.getExpenses();
      set({ expenses: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al actualizar gasto' });
      toast.error('Error al actualizar gasto');
    }
  },
  deleteExpense: async (id) => {
    try {
      await expensesApi.deleteExpense(id);
      const res = await expensesApi.getExpenses();
      set({ expenses: extractResults(res.data), error: null });
    } catch {
      set({ error: 'Error al eliminar gasto' });
      toast.error('Error al eliminar gasto');
    }
  },
}));
