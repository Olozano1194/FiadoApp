import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useClientStore } from '../clientStore';
import * as clientsApi from '../../api/clients.api';

vi.mock('../../api/clients.api');
vi.mock('react-hot-toast');

const mockClient = {
  id: 1,
  name: 'Juan Pérez',
  phone: '123456789',
  email: 'juan@test.com',
  credit_limit: '500000',
  current_debt: '0',
  created_at: '2024-01-01T00:00:00Z',
};

const initialState = {
  clients: [],
  debtors: [],
  selected: null,
  loading: false,
  error: null,
};

describe('clientStore', () => {
  beforeEach(() => {
    useClientStore.setState(initialState);
    vi.clearAllMocks();
  });

  // fetchClients
  it('fetchClients: sets loading then clients on success', async () => {
    vi.mocked(clientsApi.getClients).mockResolvedValue({
      data: [mockClient],
    } as any);

    const promise = useClientStore.getState().fetchClients();
    expect(useClientStore.getState().loading).toBe(true);

    await promise;
    expect(useClientStore.getState().loading).toBe(false);
    expect(useClientStore.getState().clients).toEqual([mockClient]);
  });

  it('fetchClients: sets error on failure', async () => {
    vi.mocked(clientsApi.getClients).mockRejectedValue(new Error('Network'));

    await useClientStore.getState().fetchClients();
    expect(useClientStore.getState().loading).toBe(false);
    expect(useClientStore.getState().error).toBe('Error al cargar clientes');
  });

  // fetchDebtors
  it('fetchDebtors: sets debtors on success', async () => {
    const debtor = { ...mockClient, current_debt: '100000' };
    vi.mocked(clientsApi.getClients).mockResolvedValue({
      data: [debtor],
    } as any);

    await useClientStore.getState().fetchDebtors();
    expect(useClientStore.getState().debtors).toEqual([debtor]);
    expect(clientsApi.getClients).toHaveBeenCalledWith(true);
  });

  it('fetchDebtors: sets error on failure', async () => {
    vi.mocked(clientsApi.getClients).mockRejectedValue(new Error('fail'));

    await useClientStore.getState().fetchDebtors();
    expect(useClientStore.getState().error).toBe('Error al cargar deudores');
  });

  // createClient
  it('createClient: re-fetches clients on success', async () => {
    vi.mocked(clientsApi.createClient).mockResolvedValue({} as any);
    vi.mocked(clientsApi.getClients).mockResolvedValue({
      data: [mockClient],
    } as any);

    await useClientStore.getState().createClient({ name: 'New Client' });
    expect(useClientStore.getState().clients).toEqual([mockClient]);
  });

  it('createClient: sets error on failure', async () => {
    vi.mocked(clientsApi.createClient).mockRejectedValue(new Error('fail'));

    await useClientStore.getState().createClient({ name: 'New Client' });
    expect(useClientStore.getState().error).toBe('Error al crear cliente');
  });

  // updateClient
  it('updateClient: re-fetches clients on success', async () => {
    vi.mocked(clientsApi.updateClient).mockResolvedValue({} as any);
    vi.mocked(clientsApi.getClients).mockResolvedValue({
      data: [mockClient],
    } as any);

    await useClientStore.getState().updateClient(1, { name: 'Updated' });
    expect(useClientStore.getState().clients).toEqual([mockClient]);
  });

  it('updateClient: sets error on failure', async () => {
    vi.mocked(clientsApi.updateClient).mockRejectedValue(new Error('fail'));

    await useClientStore.getState().updateClient(1, { name: 'Updated' });
    expect(useClientStore.getState().error).toBe('Error al actualizar cliente');
  });

  // deleteClient
  it('deleteClient: re-fetches clients on success', async () => {
    vi.mocked(clientsApi.deleteClient).mockResolvedValue({} as any);
    vi.mocked(clientsApi.getClients).mockResolvedValue({
      data: [],
    } as any);

    await useClientStore.getState().deleteClient(1);
    expect(useClientStore.getState().clients).toEqual([]);
  });

  it('deleteClient: sets error on failure', async () => {
    vi.mocked(clientsApi.deleteClient).mockRejectedValue(new Error('fail'));

    await useClientStore.getState().deleteClient(1);
    expect(useClientStore.getState().error).toBe('Error al eliminar cliente');
  });
});
