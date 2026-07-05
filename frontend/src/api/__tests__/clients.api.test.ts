import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientsApi from '../clients.api';

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

describe('clients.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getClients gets /clients/', async () => {
    const clients = [{ id: 1, name: 'Juan', debt: '100' }];
    vi.mocked(mockApi.get).mockResolvedValue({ data: clients });

    const result = await clientsApi.getClients();

    expect(mockApi.get).toHaveBeenCalledWith('/clients/', { params: {} });
    expect(result.data).toEqual(clients);
  });

  it('getClients sends debt param when filter is true', async () => {
    vi.mocked(mockApi.get).mockResolvedValue({ data: [] });

    await clientsApi.getClients(true);

    expect(mockApi.get).toHaveBeenCalledWith('/clients/', { params: { debt: 'true' } });
  });

  it('getClient gets /clients/{id}/', async () => {
    const client = { id: 5, name: 'Maria', debt: '0' };
    vi.mocked(mockApi.get).mockResolvedValue({ data: client });

    const result = await clientsApi.getClient(5);

    expect(mockApi.get).toHaveBeenCalledWith('/clients/5/');
    expect(result.data).toEqual(client);
  });

  it('createClient posts to /clients/ with data', async () => {
    const data = { name: 'New', debt: '0' };
    const created = { id: 10, ...data };
    vi.mocked(mockApi.post).mockResolvedValue({ data: created });

    const result = await clientsApi.createClient(data);

    expect(mockApi.post).toHaveBeenCalledWith('/clients/', data);
    expect(result.data).toEqual(created);
  });

  it('updateClient puts to /clients/{id}/ with data', async () => {
    const data = { name: 'Updated' };
    vi.mocked(mockApi.put).mockResolvedValue({ data: { id: 1, ...data, debt: '0' } });

    const result = await clientsApi.updateClient(1, data);

    expect(mockApi.put).toHaveBeenCalledWith('/clients/1/', data);
    expect(result.data.name).toBe('Updated');
  });

  it('deleteClient deletes /clients/{id}/', async () => {
    vi.mocked(mockApi.delete).mockResolvedValue({ data: {} });

    await clientsApi.deleteClient(3);

    expect(mockApi.delete).toHaveBeenCalledWith('/clients/3/');
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(clientsApi.getClients()).rejects.toThrow('fail');
  });
});
