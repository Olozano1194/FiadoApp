import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExpenseStore } from '../expenseStore';
import * as expensesApi from '../../api/expenses.api';

vi.mock('../../api/expenses.api');
vi.mock('react-hot-toast');

const mockExpense = {
  id: 1,
  amount: '50000',
  description: 'Test expense',
  category: 'SERVICES',
  date: '2024-06-15',
  created_at: '2024-06-15T00:00:00Z',
};

const initialState = {
  expenses: [],
  selected: null,
  loading: false,
  error: null,
};

describe('expenseStore', () => {
  beforeEach(() => {
    useExpenseStore.setState(initialState);
    vi.clearAllMocks();
  });

  // fetchExpenses
  it('fetchExpenses: sets loading then expenses on success', async () => {
    vi.mocked(expensesApi.getExpenses).mockResolvedValue({
      data: { results: [mockExpense] },
    } as any);

    const promise = useExpenseStore.getState().fetchExpenses();
    expect(useExpenseStore.getState().loading).toBe(true);

    await promise;
    expect(useExpenseStore.getState().loading).toBe(false);
    expect(useExpenseStore.getState().expenses).toEqual([mockExpense]);
  });

  it('fetchExpenses: uses direct array response', async () => {
    vi.mocked(expensesApi.getExpenses).mockResolvedValue({
      data: [mockExpense],
    } as any);

    await useExpenseStore.getState().fetchExpenses();
    expect(useExpenseStore.getState().expenses).toEqual([mockExpense]);
  });

  it('fetchExpenses: sets error on failure', async () => {
    vi.mocked(expensesApi.getExpenses).mockRejectedValue(new Error('fail'));

    await useExpenseStore.getState().fetchExpenses();
    expect(useExpenseStore.getState().loading).toBe(false);
    expect(useExpenseStore.getState().error).toBe('Error al cargar gastos');
  });

  it('fetchExpenses: passes params to API', async () => {
    vi.mocked(expensesApi.getExpenses).mockResolvedValue({
      data: [],
    } as any);

    await useExpenseStore.getState().fetchExpenses({
      date_from: '2024-06-01',
      date_to: '2024-06-30',
    });
    expect(expensesApi.getExpenses).toHaveBeenCalledWith({
      date_from: '2024-06-01',
      date_to: '2024-06-30',
    });
  });

  // createExpense
  it('createExpense: re-fetches expenses on success', async () => {
    vi.mocked(expensesApi.createExpense).mockResolvedValue({} as any);
    vi.mocked(expensesApi.getExpenses).mockResolvedValue({
      data: [mockExpense],
    } as any);

    await useExpenseStore.getState().createExpense({
      amount: '50000',
      description: 'New expense',
      category: 'SERVICES',
      date: '2024-06-15',
    });
    expect(useExpenseStore.getState().expenses).toEqual([mockExpense]);
  });

  it('createExpense: sets error on failure', async () => {
    vi.mocked(expensesApi.createExpense).mockRejectedValue(new Error('fail'));

    await useExpenseStore.getState().createExpense({
      amount: '50000',
      description: 'New expense',
      category: 'SERVICES',
      date: '2024-06-15',
    });
    expect(useExpenseStore.getState().error).toBe('Error al crear gasto');
  });

  // updateExpense
  it('updateExpense: re-fetches expenses on success', async () => {
    vi.mocked(expensesApi.updateExpense).mockResolvedValue({} as any);
    vi.mocked(expensesApi.getExpenses).mockResolvedValue({
      data: [mockExpense],
    } as any);

    await useExpenseStore.getState().updateExpense(1, { amount: '60000' });
    expect(useExpenseStore.getState().expenses).toEqual([mockExpense]);
  });

  it('updateExpense: sets error on failure', async () => {
    vi.mocked(expensesApi.updateExpense).mockRejectedValue(new Error('fail'));

    await useExpenseStore.getState().updateExpense(1, { amount: '60000' });
    expect(useExpenseStore.getState().error).toBe('Error al actualizar gasto');
  });

  // deleteExpense
  it('deleteExpense: re-fetches expenses on success', async () => {
    vi.mocked(expensesApi.deleteExpense).mockResolvedValue({} as any);
    vi.mocked(expensesApi.getExpenses).mockResolvedValue({
      data: [],
    } as any);

    await useExpenseStore.getState().deleteExpense(1);
    expect(useExpenseStore.getState().expenses).toEqual([]);
  });

  it('deleteExpense: sets error on failure', async () => {
    vi.mocked(expensesApi.deleteExpense).mockRejectedValue(new Error('fail'));

    await useExpenseStore.getState().deleteExpense(1);
    expect(useExpenseStore.getState().error).toBe('Error al eliminar gasto');
  });
});
