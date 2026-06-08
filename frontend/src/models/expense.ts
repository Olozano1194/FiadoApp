export type ExpenseCategory = 'RENT' | 'SERVICES' | 'INVENTORY' | 'SALARY' | 'TAXES' | 'MARKETING' | 'MAINTENANCE' | 'OTHER';

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  RENT: 'Alquiler',
  SERVICES: 'Servicios',
  INVENTORY: 'Reposición de Inventario',
  SALARY: 'Sueldos',
  TAXES: 'Impuestos',
  MARKETING: 'Marketing',
  MAINTENANCE: 'Mantenimiento',
  OTHER: 'Varios',
};

export interface Expense {
  id: number;
  amount: string;
  description: string;
  category: ExpenseCategory;
  date: string;
  created_at: string;
}

export interface ExpenseFormData {
  amount: string;
  description: string;
  category: ExpenseCategory;
  date: string;
}
