import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import * as settingsApi from '../settings.api';

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

// Mock URL.createObjectURL and document.createElement for export/triggerDownload
beforeAll(() => {
  vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node as any);
  vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node as any);
});

describe('settings.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('changePassword', () => {
    it('posts to /change-password/ with old and new password', async () => {
      const payload = { oldPassword: 'old', newPassword: 'new' };
      const response = { data: { detail: 'Password changed' } };
      vi.mocked(mockApi.post).mockResolvedValue(response);

      const result = await settingsApi.changePassword(payload);

      expect(mockApi.post).toHaveBeenCalledWith('/change-password/', {
        old_password: 'old',
        new_password: 'new',
      });
      expect(result).toEqual(response.data);
    });

    it('propagates error on failure', async () => {
      vi.mocked(mockApi.post).mockRejectedValue(new Error('fail'));

      await expect(settingsApi.changePassword({ oldPassword: 'x', newPassword: 'y' })).rejects.toThrow('fail');
    });
  });

  describe('export functions', () => {
    it('exportClients gets /export/clients/ with blob response', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({ data: new Blob() });

      await settingsApi.exportClients();

      expect(mockApi.get).toHaveBeenCalledWith('/export/clients/', { responseType: 'blob' });
    });

    it('exportProducts gets /export/products/ with blob response', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({ data: new Blob() });

      await settingsApi.exportProducts();

      expect(mockApi.get).toHaveBeenCalledWith('/export/products/', { responseType: 'blob' });
    });

    it('exportSales gets /export/sales/ with blob response', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({ data: new Blob() });

      await settingsApi.exportSales();

      expect(mockApi.get).toHaveBeenCalledWith('/export/sales/', { responseType: 'blob' });
    });

    it('exportExpenses gets /export/expenses/ with blob response', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({ data: new Blob() });

      await settingsApi.exportExpenses();

      expect(mockApi.get).toHaveBeenCalledWith('/export/expenses/', { responseType: 'blob' });
    });
  });

  describe('exportDb', () => {
    it('gets backup/export/ with blob response', async () => {
      const blob = new Blob(['test']);
      vi.mocked(mockApi.get).mockResolvedValue({ data: blob });

      const result = await settingsApi.exportDb();

      expect(mockApi.get).toHaveBeenCalledWith('backup/export/', { responseType: 'blob' });
      expect(result).toBe(blob);
    });
  });

  describe('importDb', () => {
    it('posts backup/import/ with FormData and multipart headers', async () => {
      const file = new File(['data'], 'backup.db');
      const response = { data: { success: true, message: 'OK' } };
      vi.mocked(mockApi.post).mockResolvedValue(response);

      const result = await settingsApi.importDb(file);

      expect(mockApi.post).toHaveBeenCalledWith(
        'backup/import/',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      expect(result).toEqual(response.data);
    });
  });

  describe('backup config', () => {
    it('getBackupConfig gets backup/config/', async () => {
      const config = { backups_enabled: true, backup_time: '02:00' };
      vi.mocked(mockApi.get).mockResolvedValue({ data: config });

      const result = await settingsApi.getBackupConfig();

      expect(mockApi.get).toHaveBeenCalledWith('backup/config/');
      expect(result).toEqual(config);
    });

    it('updateBackupConfig puts backup/config/ with data', async () => {
      const data = { backups_enabled: false };
      const response = { success: true };
      vi.mocked(mockApi.put).mockResolvedValue({ data: response });

      const result = await settingsApi.updateBackupConfig(data);

      expect(mockApi.put).toHaveBeenCalledWith('backup/config/', data);
      expect(result).toEqual(response);
    });
  });

  describe('cloud backup', () => {
    it('uploadCloudBackup posts backup/cloud/upload/', async () => {
      const response = { success: true, remote_path: '/backups/db.sqlite3' };
      vi.mocked(mockApi.post).mockResolvedValue({ data: response });

      const result = await settingsApi.uploadCloudBackup();

      expect(mockApi.post).toHaveBeenCalledWith('backup/cloud/upload/');
      expect(result).toEqual(response);
    });

    it('listCloudBackups gets backup/cloud/list/', async () => {
      const response = { backups: [{ name: 'backup1', size: 100, updated_at: '' }] };
      vi.mocked(mockApi.get).mockResolvedValue({ data: response });

      const result = await settingsApi.listCloudBackups();

      expect(mockApi.get).toHaveBeenCalledWith('backup/cloud/list/');
      expect(result).toEqual(response);
    });

    it('restoreCloudBackup posts backup/cloud/restore/{filename}/', async () => {
      const response = { success: true, message: 'Restored' };
      vi.mocked(mockApi.post).mockResolvedValue({ data: response });

      const result = await settingsApi.restoreCloudBackup('backup.db');

      expect(mockApi.post).toHaveBeenCalledWith('backup/cloud/restore/backup.db/');
      expect(result).toEqual(response);
    });

    it('restoreCloudBackup encodes filename', async () => {
      vi.mocked(mockApi.post).mockResolvedValue({ data: { success: true, message: '' } });

      await settingsApi.restoreCloudBackup('my backup.db');

      expect(mockApi.post).toHaveBeenCalledWith('backup/cloud/restore/my%20backup.db/');
    });
  });

  describe('importProducts', () => {
    it('posts import/products/ with FormData and multipart headers', async () => {
      const file = new File(['data'], 'products.xlsx');
      const response = { created: 5, updated: 2, errors: [] };
      vi.mocked(mockApi.post).mockResolvedValue({ data: response });

      const result = await settingsApi.importProducts(file);

      expect(mockApi.post).toHaveBeenCalledWith(
        'import/products/',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      expect(result).toEqual(response);
    });
  });

  describe('downloadImportTemplate', () => {
    it('gets import/products/template/ with blob response', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({ data: new Blob() });

      await settingsApi.downloadImportTemplate();

      expect(mockApi.get).toHaveBeenCalledWith('import/products/template/', { responseType: 'blob' });
    });
  });

  describe('store config', () => {
    it('getStoreConfig gets store-config/', async () => {
      const config = { store_name: 'Mi Tienda' };
      vi.mocked(mockApi.get).mockResolvedValue({ data: config });

      const result = await settingsApi.getStoreConfig();

      expect(mockApi.get).toHaveBeenCalledWith('store-config/');
      expect(result).toEqual(config);
    });

    it('updateStoreConfig patches store-config/ with data', async () => {
      const data = { store_name: 'Updated' };
      vi.mocked(mockApi.patch).mockResolvedValue({ data });

      const result = await settingsApi.updateStoreConfig(data);

      expect(mockApi.patch).toHaveBeenCalledWith('store-config/', data);
      expect(result).toEqual(data);
    });
  });

  it('propagates error on failure', async () => {
    vi.mocked(mockApi.get).mockRejectedValue(new Error('fail'));

    await expect(settingsApi.getStoreConfig()).rejects.toThrow('fail');
  });
});
