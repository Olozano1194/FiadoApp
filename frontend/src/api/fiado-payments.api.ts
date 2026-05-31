import api from './axios.config';
import type { FiadoPayment } from '../models/fiado-payment';

export const getPayments = (clientId?: number) => {
    const params = clientId ? { client: clientId } : {};
    return api.get<FiadoPayment[]>('/fiado-payments/', { params });
};

export const createPayment = (data: { client: number; amount: string; notes?: string }) =>
    api.post<FiadoPayment>('/fiado-payments/', data);

export interface TodayPayments {
    total: string;
    count: number;
}

export const getTodayPayments = () =>
    api.get<TodayPayments>('/fiado-payments/today/');
