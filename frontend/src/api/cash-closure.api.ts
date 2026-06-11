import api from './axios.config';
import type { CashClosure, CashClosurePreview, CreateClosurePayload } from '../models/cash-closure';

export const getPreview = () =>
  api.get<CashClosurePreview>('/cash-closures/preview/').then((r) => r.data);

export const createClosure = (data: CreateClosurePayload) =>
  api.post<CashClosure>('/cash-closures/', data).then((r) => r.data);

export const listClosures = (params?: { page?: number }) =>
  api.get<CashClosure[]>('/cash-closures/', { params }).then((r) => r.data);
