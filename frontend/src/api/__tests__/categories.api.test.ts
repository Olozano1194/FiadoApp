import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as categoriesApi from '../categories.api';

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

describe('categories.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCategories gets /categories/', async () => {
    const categories = [{ id: 1, name: 'Bebidas', description: '' }];
    vi.mocked(mockApi.get).mockResolvedValue({ data: categories });

    const result = await categoriesApi.getCategories();

    expect(mockApi.get).toHaveBeenCalledWith('/categories/');
    expect(result.data).toEqual(categories);
  });

  it('createCategory posts to /categories/ with data', async () => {
    const data = { name: 'Nueva Categoría' };
    const created = { id: 2, ...data, description: '' };
    vi.mocked(mockApi.post).mockResolvedValue({ data: created });

    const result = await categoriesApi.createCategory(data);

    expect(mockApi.post).toHaveBeenCalledWith('/categories/', data);
    expect(result.data).toEqual(created);
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(categoriesApi.getCategories()).rejects.toThrow('fail');
  });
});
