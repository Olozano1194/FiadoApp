import type { BackupConfig } from '../types/backup';
import api from './axios.config';

export const changePassword = async ({
  oldPassword,
  newPassword,
}: {
  oldPassword: string;
  newPassword: string;
}) => {
  const response = await api.post('/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return response.data as { detail: string };
};

export const triggerDownload = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportClients = async () => {
  const response = await api.get('/export/clients/', { responseType: 'blob' });
  triggerDownload(response.data, 'clientes.xlsx');
};

export const exportProducts = async () => {
  const response = await api.get('/export/products/', { responseType: 'blob' });
  triggerDownload(response.data, 'productos.xlsx');
};

export const exportSales = async () => {
  const response = await api.get('/export/sales/', { responseType: 'blob' });
  triggerDownload(response.data, 'ventas.xlsx');
};

export const exportDb = async (): Promise<Blob> => {
  const response = await api.get('backup/export/', {
    responseType: 'blob',
  });
  return response.data;
};

export const importDb = async (file: File): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('backup/import/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getBackupConfig = async (): Promise<BackupConfig> => {
  const response = await api.get('backup/config/');
  return response.data;
};

export const updateBackupConfig = async (data: Partial<BackupConfig>): Promise<{ success: boolean }> => {
  const response = await api.put('backup/config/', data);
  return response.data;
};
