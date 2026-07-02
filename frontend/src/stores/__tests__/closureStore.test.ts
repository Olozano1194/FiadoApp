import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useClosureStore } from '../closureStore';
import * as cashClosureApi from '../../api/cash-closure.api';

vi.mock('../../api/cash-closure.api');

const mockPreview = {
  date: '2024-06-15',
  total_sales: '500000',
  cash_sales: '300000',
  credit_sales: '200000',
  sales_count: 10,
  fiado_payments: '50000',
  expenses: '100000',
  net_profit: '400000',
  expected_cash: '350000',
  already_closed: false,
};

const initialState = {
  preview: null,
  loading: false,
  creating: false,
  error: null,
  isAlreadyClosed: false,
};

describe('closureStore', () => {
  beforeEach(() => {
    useClosureStore.setState(initialState);
    vi.clearAllMocks();
  });

  // fetchPreview
  it('fetchPreview: sets loading then preview on success', async () => {
    vi.mocked(cashClosureApi.getPreview).mockResolvedValue(mockPreview);

    const promise = useClosureStore.getState().fetchPreview();
    expect(useClosureStore.getState().loading).toBe(true);

    await promise;
    expect(useClosureStore.getState().loading).toBe(false);
    expect(useClosureStore.getState().preview).toEqual(mockPreview);
  });

  it('fetchPreview: sets error on failure', async () => {
    vi.mocked(cashClosureApi.getPreview).mockRejectedValue(new Error('fail'));

    await useClosureStore.getState().fetchPreview();
    expect(useClosureStore.getState().loading).toBe(false);
    expect(useClosureStore.getState().error).toBe('Error al cargar previsualización');
  });

  it('fetchPreview: extracts detail from axios error', async () => {
    vi.mocked(cashClosureApi.getPreview).mockRejectedValue({
      response: { data: { detail: 'Ya existe un cierre para hoy' } },
    });

    await useClosureStore.getState().fetchPreview();
    expect(useClosureStore.getState().error).toBe('Ya existe un cierre para hoy');
  });

  // createClosure
  it('createClosure: sets creating then completes on success', async () => {
    vi.mocked(cashClosureApi.createClosure).mockResolvedValue({} as any);

    const promise = useClosureStore.getState().createClosure(350000);
    expect(useClosureStore.getState().creating).toBe(true);

    await promise;
    expect(useClosureStore.getState().creating).toBe(false);
    expect(useClosureStore.getState().error).toBeNull();
  });

  it('createClosure: re-throws error on failure', async () => {
    vi.mocked(cashClosureApi.createClosure).mockRejectedValue(new Error('fail'));

    await expect(useClosureStore.getState().createClosure(350000)).rejects.toThrow();
    expect(useClosureStore.getState().creating).toBe(false);
    expect(useClosureStore.getState().error).toBe('Error al registrar cierre');
  });

  // isAlreadyClosed
  it('isAlreadyClosed is false when preview is null', () => {
    expect(useClosureStore.getState().isAlreadyClosed).toBe(false);
  });

  it('isAlreadyClosed updates when fetchPreview returns already_closed=true', async () => {
    vi.mocked(cashClosureApi.getPreview).mockResolvedValue({ ...mockPreview, already_closed: true });

    await useClosureStore.getState().fetchPreview();

    expect(useClosureStore.getState().isAlreadyClosed).toBe(true);
  });

  it('isAlreadyClosed is false when fetchPreview returns already_closed=false', async () => {
    vi.mocked(cashClosureApi.getPreview).mockResolvedValue(mockPreview);

    await useClosureStore.getState().fetchPreview();

    expect(useClosureStore.getState().isAlreadyClosed).toBe(false);
  });

  // reset
  it('reset: clears state to initial values', () => {
    useClosureStore.setState({
      preview: mockPreview,
      loading: true,
      creating: true,
      error: 'some error',
      isAlreadyClosed: true,
    });

    useClosureStore.getState().reset();

    expect(useClosureStore.getState().preview).toBeNull();
    expect(useClosureStore.getState().loading).toBe(false);
    expect(useClosureStore.getState().creating).toBe(false);
    expect(useClosureStore.getState().error).toBeNull();
    expect(useClosureStore.getState().isAlreadyClosed).toBe(false);
  });
});
