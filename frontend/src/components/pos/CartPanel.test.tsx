import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CartPanel from './CartPanel';
import { useSaleStore } from '../../stores/saleStore';
import { createMockSaleStore } from '../../test/mocks/saleStoreMock';
import type { MockSaleStore } from '../../test/mocks/saleStoreMock';
import type { CartItem } from '../../models/sale';

vi.mock('../../stores/saleStore', () => ({
  useSaleStore: vi.fn(),
}));

vi.mock('react-hot-toast');

function createItem(id: number, overrides: Partial<CartItem> = {}): CartItem {
  return {
    product: {
      id,
      name: `Product ${id}`,
      price: '10000',
      cost: '5000',
      stock: 10,
      min_stock: 2,
      category_name: 'Test',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    quantity: 2,
    subtotal: 20000,
    ...overrides,
  };
}

describe('CartPanel', () => {
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

  it('renders empty state when cart is empty', () => {
    render(<CartPanel />);

    expect(screen.getByText('Carrito vacío')).toBeInTheDocument();
    expect(screen.queryByText('Vaciar')).not.toBeInTheDocument();
  });

  it('renders single item with name, price, qty, subtotal and profit', () => {
    const items = [createItem(1)];
    mockStore.cart = items;
    mockStore.getCartTotal = vi.fn(() => 20000);

    render(<CartPanel />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getAllByText(/20\.000/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders three item rows for multiple items', () => {
    mockStore.cart = [createItem(1), createItem(2), createItem(3)];
    mockStore.getCartTotal = vi.fn(() => 60000);

    render(<CartPanel />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('calls updateQuantity with incremented value on + click', async () => {
    const user = userEvent.setup();
    mockStore.cart = [createItem(1)];
    mockStore.getCartTotal = vi.fn(() => 20000);

    render(<CartPanel />);

    const plusBtn = screen.getAllByText('+')[0];
    await user.click(plusBtn);

    expect(mockStore.updateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('calls updateQuantity with decremented value on - click', async () => {
    const user = userEvent.setup();
    mockStore.cart = [createItem(1)];
    mockStore.getCartTotal = vi.fn(() => 20000);

    render(<CartPanel />);

    const minusBtn = screen.getAllByText('-')[0];
    await user.click(minusBtn);

    expect(mockStore.updateQuantity).toHaveBeenCalledWith(1, 1);
  });

  it('disables + button when quantity equals stock', () => {
    mockStore.cart = [{
      product: {
        id: 1,
        name: 'Product 1',
        price: '10000',
        cost: '5000',
        stock: 2,
        min_stock: 2,
        category_name: 'Test',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      quantity: 2,
      subtotal: 20000,
    }];
    mockStore.getCartTotal = vi.fn(() => 20000);

    render(<CartPanel />);

    const plusBtn = screen.getAllByText('+')[0];
    expect(plusBtn).toBeDisabled();
  });

  it('calls removeFromCart with product id on remove click', async () => {
    const user = userEvent.setup();
    mockStore.cart = [createItem(1), createItem(2)];
    mockStore.getCartTotal = vi.fn(() => 40000);

    render(<CartPanel />);

    const removeBtns = screen.getAllByTitle('Eliminar producto');
    await user.click(removeBtns[0]);

    expect(mockStore.removeFromCart).toHaveBeenCalledWith(1);
  });

  it('calls clearCart on Vaciar button click', async () => {
    const user = userEvent.setup();
    mockStore.cart = [createItem(1)];
    mockStore.getCartTotal = vi.fn(() => 20000);

    render(<CartPanel />);

    const clearBtn = screen.getByText('Vaciar');
    await user.click(clearBtn);

    expect(mockStore.clearCart).toHaveBeenCalled();
  });

  it('shows total, total profit and margin in the totals section', () => {
    mockStore.cart = [createItem(1)];
    mockStore.getCartTotal = vi.fn(() => 20000);

    render(<CartPanel />);

    expect(screen.getByText('Total Venta')).toBeInTheDocument();
    expect(screen.getByText('Ganancia Total')).toBeInTheDocument();
    expect(screen.getByText('Margen')).toBeInTheDocument();
  });

  it('displays positive profit in green', () => {
    mockStore.cart = [createItem(1)];
    mockStore.getCartTotal = vi.fn(() => 20000);

    const { container } = render(<CartPanel />);

    // profit = 20000 - (5000 * 2) = 10000 → positive → text-green-600
    const greenElements = container.querySelectorAll('.text-green-600');
    expect(greenElements.length).toBeGreaterThan(0);
  });

  it('displays negative profit in red', () => {
    mockStore.cart = [{
      product: {
        id: 1,
        name: 'Product 1',
        price: '10000',
        cost: '12000',
        stock: 10,
        min_stock: 2,
        category_name: 'Test',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      quantity: 2,
      subtotal: 20000,
    }];
    mockStore.getCartTotal = vi.fn(() => 20000);

    const { container } = render(<CartPanel />);

    // profit = 20000 - (12000 * 2) = -4000 → negative → text-text-error
    const errorElements = container.querySelectorAll('.text-text-error');
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('formats all monetary values with formatCurrency', () => {
    mockStore.cart = [createItem(1)];
    mockStore.getCartTotal = vi.fn(() => 20000);

    render(<CartPanel />);

    // subtotal and total should appear formatted (es-CO locale)
    expect(screen.getAllByText(/20\.000/).length).toBeGreaterThanOrEqual(1);
  });
});