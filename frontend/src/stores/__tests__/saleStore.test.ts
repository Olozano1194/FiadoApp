import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSaleStore } from '../saleStore';
import * as salesApi from '../../api/sales.api';

vi.mock('../../api/sales.api');
vi.mock('react-hot-toast');

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: '1000',
  stock: 10,
  min_stock: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockSale = {
  id: 1,
  client: null,
  created_at: '2024-06-15T10:00:00Z',
  total: '2000',
  payment_method: 'CASH' as const,
  status: 'COMPLETED' as const,
  items: [],
};

const mockRecentSale = {
  id: 1,
  cliente: 'Juan Pérez',
  hora: '10:30',
  estado: 'COMPLETED',
  total: '25000',
};

const initialState = {
  sales: [],
  recentSales: [],
  loading: false,
  cart: [],
  selectedPaymentMethod: 'CASH' as const,
  selectedClient: null,
  isSubmitting: false,
  lastSale: null,
  error: null,
  cashReceived: 0,
  change: 0,
};

describe('saleStore', () => {
  beforeEach(() => {
    useSaleStore.setState(initialState);
    vi.clearAllMocks();
  });

  // fetchSales
  it('fetchSales: sets loading then sales on success with results wrapper', async () => {
    vi.mocked(salesApi.getSales).mockResolvedValue({
      data: { results: [mockSale] },
    } as any);

    const promise = useSaleStore.getState().fetchSales();
    expect(useSaleStore.getState().loading).toBe(true);

    await promise;
    expect(useSaleStore.getState().loading).toBe(false);
    expect(useSaleStore.getState().sales).toEqual([mockSale]);
  });

  it('fetchSales: handles direct array response', async () => {
    vi.mocked(salesApi.getSales).mockResolvedValue({
      data: [mockSale],
    } as any);

    await useSaleStore.getState().fetchSales();
    expect(useSaleStore.getState().sales).toEqual([mockSale]);
  });

  it('fetchSales: sets error on failure', async () => {
    vi.mocked(salesApi.getSales).mockRejectedValue(new Error('fail'));

    await useSaleStore.getState().fetchSales();
    expect(useSaleStore.getState().loading).toBe(false);
    expect(useSaleStore.getState().error).toBe('Error al cargar ventas');
  });

  // fetchRecentSales
  it('fetchRecentSales: sets loading then recentSales on success', async () => {
    vi.mocked(salesApi.getRecentSales).mockResolvedValue({
      data: [mockRecentSale],
    } as any);

    const promise = useSaleStore.getState().fetchRecentSales(5);
    expect(useSaleStore.getState().loading).toBe(true);

    await promise;
    expect(useSaleStore.getState().loading).toBe(false);
    expect(useSaleStore.getState().recentSales).toEqual([mockRecentSale]);
  });

  it('fetchRecentSales: sets error on failure', async () => {
    vi.mocked(salesApi.getRecentSales).mockRejectedValue(new Error('fail'));

    await useSaleStore.getState().fetchRecentSales();
    expect(useSaleStore.getState().loading).toBe(false);
    expect(useSaleStore.getState().error).toBe('Error al cargar ventas recientes');
  });

  // createSale
  it('createSale: re-fetches sales on success', async () => {
    vi.mocked(salesApi.createSale).mockResolvedValue({} as any);
    vi.mocked(salesApi.getSales).mockResolvedValue({
      data: [mockSale],
    } as any);

    await useSaleStore.getState().createSale({});
    expect(useSaleStore.getState().sales).toEqual([mockSale]);
  });

  it('createSale: sets error on failure', async () => {
    vi.mocked(salesApi.createSale).mockRejectedValue(new Error('fail'));

    await useSaleStore.getState().createSale({});
    expect(useSaleStore.getState().error).toBe('Error al crear la venta');
  });

  // Cart operations
  it('addToCart: adds new product to cart', () => {
    useSaleStore.getState().addToCart(mockProduct);
    const cart = useSaleStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].product.id).toBe(1);
    expect(cart[0].quantity).toBe(1);
    expect(cart[0].subtotal).toBe(1000);
  });

  it('addToCart: increments quantity when product already in cart', () => {
    useSaleStore.getState().addToCart(mockProduct);
    useSaleStore.getState().addToCart(mockProduct);

    const cart = useSaleStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
    expect(cart[0].subtotal).toBe(2000);
  });

  it('removeFromCart: removes product from cart', () => {
    useSaleStore.getState().addToCart(mockProduct);
    useSaleStore.getState().removeFromCart(1);
    expect(useSaleStore.getState().cart).toHaveLength(0);
  });

  it('updateQuantity: updates product quantity and subtotal', () => {
    useSaleStore.getState().addToCart(mockProduct);
    useSaleStore.getState().updateQuantity(1, 5);

    const item = useSaleStore.getState().cart[0];
    expect(item.quantity).toBe(5);
    expect(item.subtotal).toBe(5000);
  });

  it('updateQuantity: minimum quantity is 1', () => {
    useSaleStore.getState().addToCart(mockProduct);
    useSaleStore.getState().updateQuantity(1, 0);

    expect(useSaleStore.getState().cart[0].quantity).toBe(1);
  });

  it('clearCart: resets cart and related state', () => {
    useSaleStore.getState().addToCart(mockProduct);
    useSaleStore.getState().setPaymentMethod('CREDIT');
    useSaleStore.getState().clearCart();

    const s = useSaleStore.getState();
    expect(s.cart).toEqual([]);
    expect(s.selectedPaymentMethod).toBe('CASH');
    expect(s.selectedClient).toBeNull();
    expect(s.lastSale).toBeNull();
    expect(s.cashReceived).toBe(0);
    expect(s.change).toBe(0);
  });

  // Payment methods
  it('setPaymentMethod: switches to CREDIT', () => {
    useSaleStore.getState().setPaymentMethod('CREDIT');
    expect(useSaleStore.getState().selectedPaymentMethod).toBe('CREDIT');
    expect(useSaleStore.getState().cashReceived).toBe(0);
    expect(useSaleStore.getState().change).toBe(0);
  });

  it('setPaymentMethod: switches to CASH preserves cashReceived', () => {
    useSaleStore.setState({ cashReceived: 5000, change: 3000 });
    useSaleStore.getState().setPaymentMethod('CASH');
    expect(useSaleStore.getState().selectedPaymentMethod).toBe('CASH');
  });

  // Cash handling
  it('setCashReceived: updates cashReceived and change', () => {
    useSaleStore.getState().addToCart(mockProduct); // subtotal = 1000
    useSaleStore.getState().setCashReceived(2000);

    expect(useSaleStore.getState().cashReceived).toBe(2000);
    expect(useSaleStore.getState().change).toBe(1000);
  });

  // getCartTotal
  it('getCartTotal: returns sum of all subtotals', () => {
    const product2 = { ...mockProduct, id: 2, name: 'Product 2', price: '2000' };
    useSaleStore.getState().addToCart(mockProduct);  // subtotal = 1000
    useSaleStore.getState().addToCart(product2);     // subtotal = 2000

    expect(useSaleStore.getState().getCartTotal()).toBe(3000);
  });

  // completeSale
  it('completeSale: builds payload and calls API on success', async () => {
    vi.mocked(salesApi.createSale).mockResolvedValue({
      data: { id: 10, total: '1000', payment_method: 'CASH', status: 'COMPLETED', items: [], created_at: '' },
    } as any);

    useSaleStore.getState().addToCart(mockProduct); // 1 x 1000
    useSaleStore.getState().setCashReceived(2000);

    await useSaleStore.getState().completeSale();

    const s = useSaleStore.getState();
    expect(s.isSubmitting).toBe(false);
    expect(s.lastSale).toBeTruthy();
    expect(s.cart).toEqual([]);
    expect(salesApi.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ product: 1, quantity: 1, unit_price: 1000 }],
        payment_method: 'CASH',
        total: 1000,
        cash_received: 2000,
        change_given: 1000,
      })
    );
  });

  it('completeSale: does nothing when cart is empty', async () => {
    await useSaleStore.getState().completeSale();
    expect(salesApi.createSale).not.toHaveBeenCalled();
  });

  it('completeSale: sets error on failure', async () => {
    vi.mocked(salesApi.createSale).mockRejectedValue(new Error('fail'));

    useSaleStore.getState().addToCart(mockProduct);

    await useSaleStore.getState().completeSale();

    expect(useSaleStore.getState().isSubmitting).toBe(false);
    expect(useSaleStore.getState().error).toBe('Error al procesar la venta');
  });
});
