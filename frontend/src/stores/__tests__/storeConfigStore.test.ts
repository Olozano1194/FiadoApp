import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStoreConfig } from '../storeConfigStore';
import * as settingsApi from '../../api/settings.api';

vi.mock('../../api/settings.api');

const mockConfig = { store_name: 'Mi Tienda' };

const initialState = {
  config: null,
  loading: false,
  error: null,
  _fetched: false,
};

describe('storeConfigStore', () => {
  beforeEach(() => {
    useStoreConfig.setState(initialState);
    vi.clearAllMocks();
  });

  // fetchConfig
  it('fetchConfig: sets loading then config on success', async () => {
    vi.mocked(settingsApi.getStoreConfig).mockResolvedValue(mockConfig);

    const promise = useStoreConfig.getState().fetchConfig();
    expect(useStoreConfig.getState().loading).toBe(true);

    await promise;
    expect(useStoreConfig.getState().loading).toBe(false);
    expect(useStoreConfig.getState().config).toEqual(mockConfig);
    expect(useStoreConfig.getState()._fetched).toBe(true);
  });

  it('fetchConfig: does not fetch again if _fetched is true', async () => {
    // First call - succeeds
    vi.mocked(settingsApi.getStoreConfig).mockResolvedValue(mockConfig);
    await useStoreConfig.getState().fetchConfig();
    expect(settingsApi.getStoreConfig).toHaveBeenCalledTimes(1);

    // Reset the mock to fail - second call should not call API
    vi.mocked(settingsApi.getStoreConfig).mockClear();

    await useStoreConfig.getState().fetchConfig();
    expect(settingsApi.getStoreConfig).not.toHaveBeenCalled();
  });

  it('fetchConfig: sets error on failure', async () => {
    vi.mocked(settingsApi.getStoreConfig).mockRejectedValue(new Error('fail'));

    await useStoreConfig.getState().fetchConfig();

    const s = useStoreConfig.getState();
    expect(s.loading).toBe(false);
    expect(s.error).toBe('Error al cargar configuración');
    expect(s._fetched).toBe(true);
  });

  // updateName
  it('updateName: updates config on success', async () => {
    const updatedConfig = { store_name: 'Nuevo Nombre' };
    vi.mocked(settingsApi.updateStoreConfig).mockResolvedValue(updatedConfig);

    const promise = useStoreConfig.getState().updateName('Nuevo Nombre');
    expect(useStoreConfig.getState().loading).toBe(true);

    await promise;
    expect(useStoreConfig.getState().loading).toBe(false);
    expect(useStoreConfig.getState().config).toEqual(updatedConfig);
    expect(settingsApi.updateStoreConfig).toHaveBeenCalledWith({ store_name: 'Nuevo Nombre' });
  });

  it('updateName: sets error on failure', async () => {
    vi.mocked(settingsApi.updateStoreConfig).mockRejectedValue(new Error('fail'));

    await useStoreConfig.getState().updateName('Nuevo Nombre');

    const s = useStoreConfig.getState();
    expect(s.loading).toBe(false);
    expect(s.error).toBe('Error al actualizar nombre');
  });
});
