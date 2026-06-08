import api from './axios.config';
import type { Expense, ExpenseFormData } from '../models/expense';

export const getExpenses = () => api.get<Expense[]>('/expenses/');
export const getExpense = (id: number) => api.get<Expense>(`/expenses/${id}/`);
export const createExpense = (data: ExpenseFormData) =>
  api.post<Expense>('/expenses/', data);
export const updateExpense = (id: number, data: Partial<ExpenseFormData>) =>
  api.patch<Expense>(`/expenses/${id}/`, data);
export const deleteExpense = (id: number) => api.delete(`/expenses/${id}/`);
