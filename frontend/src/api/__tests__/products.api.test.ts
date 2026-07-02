import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as productsApi from '../products.api';

vi.mock('../axios.config', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../axios.config';
const mockApi = vi.mocked(api);

describe('products.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProducts gets /products/ with default page_size', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: { results: [] } });

    const result = await productsApi.getProducts();

    expect(mockApi.get).toHaveBeenCalledWith('/products/?page_size=100');
    expect(result.data.results).toEqual([]);
  });

  it('getProducts uses custom page_size', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: { results: [] } });

    await productsApi.getProducts(50);

    expect(mockApi.get).toHaveBeenCalledWith('/products/?page_size=50');
  });

  it('getProduct gets /products/{id}/', async () => {
    const product = { id: 1, name: 'Test', price: '100', stock: 10 };
    vi.mocked(mockApi.get).mockResolvedValue({ data: product });

    const result = await productsApi.getProduct(1);

    expect(mockApi.get).toHaveBeenCalledWith('/products/1/');
    expect(result.data).toEqual(product);
  });

  it('createProduct posts with FormData and multipart headers', async () => {
    const data = { name: 'New', price: '500', stock: 5, min_stock: 1, image: new File([''], 'test.png') };
    const created = { id: 1, ...data, image: null };
    vi.mocked(mockApi.post).mockResolvedValue({ data: created });

    const result = await productsApi.createProduct(data as any);

    expect(mockApi.post).toHaveBeenCalledWith(
      '/products/',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(result.data).toEqual(created);
  });

  it('updateProduct patches with FormData and multipart headers', async () => {
    const data = { name: 'Updated', price: '600' };
    vi.mocked(mockApi.patch).mockResolvedValue({ data: { id: 1, ...data, stock: 5 } });

    const result = await productsApi.updateProduct(1, data);

    expect(mockApi.patch).toHaveBeenCalledWith(
      '/products/1/',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(result.data.name).toBe('Updated');
  });

  it('deleteProduct deletes /products/{id}/', async () => {
    vi.mocked(mockApi.delete).mockResolvedValue({ data: {} });

    await productsApi.deleteProduct(2);

    expect(mockApi.delete).toHaveBeenCalledWith('/products/2/');
  });

  it('getLowStockProducts gets /products/low-stock/', async () => {
    const products = [{ id: 1, name: 'Low', price: '100', stock: 1 }];
    vi.mocked(mockApi.get).mockResolvedValue({ data: products });

    const result = await productsApi.getLowStockProducts();

    expect(mockApi.get).toHaveBeenCalledWith('/products/low-stock/');
    expect(result.data).toEqual(products);
  });

  it('lookupByBarcode gets /products/lookup-barcode/ with encoded barcode', async () => {
    const product = { id: 1, name: 'Scanned', price: '200', stock: 10 };
    vi.mocked(mockApi.get).mockResolvedValue({ data: product });

    const result = await productsApi.lookupByBarcode('ABC-123');

    expect(mockApi.get).toHaveBeenCalledWith('/products/lookup-barcode/?barcode=ABC-123');
    expect(result.data).toEqual(product);
  });

  it('lookupByBarcode encodes special characters', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: {} as any });

    await productsApi.lookupByBarcode('ABC 123#');

    expect(mockApi.get).toHaveBeenCalledWith('/products/lookup-barcode/?barcode=ABC%20123%23');
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(productsApi.getProducts()).rejects.toThrow('fail');
  });
});
