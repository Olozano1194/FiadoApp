import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PaymentBar from './PaymentBar';
import { useSaleStore } from '../../stores/saleStore';
import { createMockSaleStore } from '../../test/mocks/saleStoreMock';
import type { MockSaleStore } from '../../test/mocks/saleStoreMock';
import type { Client } from '../../models/client';

vi.mock('../../stores/saleStore', () => ({
  useSaleStore: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../stores/clientStore', () => ({
  useClientStore: vi.fn(() => ({
    clients: [],
    fetchClients: vi.fn().mockResolvedValue(undefined),
  })),
}));

const mockClient: Client = {
  id: 1,
  name: 'Juan Pérez',
  credit_limit: '100000',
  current_debt: '0',
  created_at: '2024-01-01',
};

function createCartItem(total: number) {
  return {
    product: {
      id: 1,
      name: 'Test Product',
      price: String(total),
      stock: 10,
      min_stock: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    quantity: 1,
    subtotal: total,
  };
}

describe('PaymentBar', () => {
  let mockStore: MockSaleStore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockSaleStore();
    // @ts-expect-error — Zustand overloaded selector needs implicit any
    vi.mocked(useSaleStore).mockImplementation(((selector) => {
      return selector ? selector(mockStore) : mockStore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
  });

  it('calls setPaymentMethod("CASH") when Efectivo is clicked in credit mode', async () => {
    const user = userEvent.setup();
    mockStore.selectedPaymentMethod = 'CREDIT';

    render(<PaymentBar />);

    await user.click(screen.getByText('Efectivo'));

    expect(mockStore.setPaymentMethod).toHaveBeenCalledWith('CASH');
  });

  it('calls setPaymentMethod("CREDIT") when Crédito is clicked', async () => {
    const user = userEvent.setup();
    mockStore.selectedPaymentMethod = 'CASH';

    render(<PaymentBar />);

    await user.click(screen.getByText('Crédito'));

    expect(mockStore.setPaymentMethod).toHaveBeenCalledWith('CREDIT');
  });

  it('shows correct change when cash received exceeds total', () => {
    mockStore.cart = [createCartItem(50000)];
    mockStore.getCartTotal = vi.fn(() => 50000);
    mockStore.cashReceived = 60000;
    mockStore.change = 10000;

    render(<PaymentBar />);

    expect(screen.getByText(/Cambio/)).toBeInTheDocument();
  });

  it('calls setCashReceived with parsed numeric value on cash input', async () => {
    const user = userEvent.setup();
    mockStore.cart = [createCartItem(50000)];
    mockStore.getCartTotal = vi.fn(() => 50000);

    render(<PaymentBar />);

    const cashInput = screen.getByPlaceholderText('$0');
    await user.type(cashInput, '60000');

    expect(mockStore.setCashReceived).toHaveBeenCalledWith(60000);
  });

  it('shows "Seleccionar Cliente" button in credit mode without client', () => {
    mockStore.selectedPaymentMethod = 'CREDIT';

    render(<PaymentBar />);

    expect(screen.getByRole('button', { name: 'Seleccionar Cliente' })).toBeInTheDocument();
  });

  it('shows client name when a client is selected in credit mode', () => {
    mockStore.selectedPaymentMethod = 'CREDIT';
    mockStore.selectedClient = mockClient;

    render(<PaymentBar />);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('opens ClientSelect modal when clicking select client button', async () => {
    const user = userEvent.setup();
    mockStore.selectedPaymentMethod = 'CREDIT';

    render(<PaymentBar />);

    const selectBtn = screen.getByRole('button', { name: 'Seleccionar Cliente' });
    await user.click(selectBtn);

    expect(screen.getByRole('heading', { name: 'Seleccionar Cliente' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar por nombre o teléfono...')).toBeInTheDocument();
  });

  it('disables submit button when cart is empty', () => {
    render(<PaymentBar />);

    expect(screen.getByText('Completar Venta')).toBeDisabled();
  });

  it('disables submit button when cash received is less than total', () => {
    mockStore.cart = [createCartItem(50000)];
    mockStore.getCartTotal = vi.fn(() => 50000);
    mockStore.cashReceived = 30000;

    render(<PaymentBar />);

    expect(screen.getByText('Completar Venta')).toBeDisabled();
  });

  it('disables submit button in credit mode without a selected client', () => {
    mockStore.selectedPaymentMethod = 'CREDIT';
    mockStore.cart = [createCartItem(50000)];
    mockStore.getCartTotal = vi.fn(() => 50000);

    render(<PaymentBar />);

    expect(screen.getByText('Completar Venta')).toBeDisabled();
  });

  it('shows loading spinner and "Procesando..." when isSubmitting', () => {
    mockStore.isSubmitting = true;
    mockStore.cart = [createCartItem(10000)];
    mockStore.getCartTotal = vi.fn(() => 10000);

    render(<PaymentBar />);

    expect(screen.getByText('Procesando...')).toBeInTheDocument();
    expect(screen.queryByText('Completar Venta')).not.toBeInTheDocument();
  });
});