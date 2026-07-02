import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProductStore } from '../productStore';
import * as productsApi from '../../api/products.api';

vi.mock('../../api/products.api');
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

const initialState = {
  products: [],
  lowStockProducts: [],
  selected: null,
  loading: false,
  error: null,
};

describe('productStore', () => {
  beforeEach(() => {
    useProductStore.setState(initialState);
    vi.clearAllMocks();
  });

  // fetchProducts
  it('fetchProducts: sets loading then products on success', async () => {
    vi.mocked(productsApi.getProducts).mockResolvedValue({
      data: [mockProduct],
    } as any);

    const promise = useProductStore.getState().fetchProducts();
    expect(useProductStore.getState().loading).toBe(true);

    await promise;
    expect(useProductStore.getState().loading).toBe(false);
    expect(useProductStore.getState().products).toEqual([mockProduct]);
  });

  it('fetchProducts: sets error on failure', async () => {
    vi.mocked(productsApi.getProducts).mockRejectedValue(new Error('Network error'));

    await useProductStore.getState().fetchProducts();
    expect(useProductStore.getState().loading).toBe(false);
    expect(useProductStore.getState().error).toBe('Error al cargar productos');
  });

  // fetchLowStock
  it('fetchLowStock: sets lowStockProducts on success', async () => {
    const lowStock = { ...mockProduct, id: 2, stock: 1 };
    vi.mocked(productsApi.getLowStockProducts).mockResolvedValue({
      data: [lowStock],
    } as any);

    await useProductStore.getState().fetchLowStock();
    expect(useProductStore.getState().lowStockProducts).toEqual([lowStock]);
  });

  it('fetchLowStock: sets error on failure', async () => {
    vi.mocked(productsApi.getLowStockProducts).mockRejectedValue(new Error('fail'));

    await useProductStore.getState().fetchLowStock();
    expect(useProductStore.getState().error).toBe('Error al cargar productos con bajo stock');
  });

  // createProduct
  it('createProduct: re-fetches products on success', async () => {
    vi.mocked(productsApi.createProduct).mockResolvedValue({} as any);
    vi.mocked(productsApi.getProducts).mockResolvedValue({
      data: [mockProduct],
    } as any);

    await useProductStore.getState().createProduct({
      name: 'New',
      price: '500',
      stock: 5,
      min_stock: 1,
    });

    expect(useProductStore.getState().products).toEqual([mockProduct]);
  });

  it('createProduct: sets error on failure', async () => {
    vi.mocked(productsApi.createProduct).mockRejectedValue(new Error('fail'));

    await useProductStore.getState().createProduct({
      name: 'New',
      price: '500',
      stock: 5,
      min_stock: 1,
    });

    expect(useProductStore.getState().error).toBe('Error al crear producto');
  });

  // updateProduct
  it('updateProduct: re-fetches products on success', async () => {
    vi.mocked(productsApi.updateProduct).mockResolvedValue({} as any);
    vi.mocked(productsApi.getProducts).mockResolvedValue({
      data: [mockProduct],
    } as any);

    await useProductStore.getState().updateProduct(1, { name: 'Updated' });
    expect(useProductStore.getState().products).toEqual([mockProduct]);
  });

  it('updateProduct: sets error on failure', async () => {
    vi.mocked(productsApi.updateProduct).mockRejectedValue(new Error('fail'));

    await useProductStore.getState().updateProduct(1, { name: 'Updated' });
    expect(useProductStore.getState().error).toBe('Error al actualizar producto');
  });

  // deleteProduct
  it('deleteProduct: re-fetches products on success', async () => {
    vi.mocked(productsApi.deleteProduct).mockResolvedValue({} as any);
    vi.mocked(productsApi.getProducts).mockResolvedValue({
      data: [],
    } as any);

    await useProductStore.getState().deleteProduct(1);
    expect(useProductStore.getState().products).toEqual([]);
  });

  it('deleteProduct: sets error on failure', async () => {
    vi.mocked(productsApi.deleteProduct).mockRejectedValue(new Error('fail'));

    await useProductStore.getState().deleteProduct(1);
    expect(useProductStore.getState().error).toBe('Error al eliminar producto');
  });
});
