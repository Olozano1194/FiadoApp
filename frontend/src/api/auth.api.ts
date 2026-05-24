import api from './axios.config';
import type { LoginCredentials, AuthTokens } from '../models/auth';

export const login = (credentials: LoginCredentials) =>
  api.post<AuthTokens>('/token/', credentials);

export const refresh = (refreshToken: string) =>
  api.post<AuthTokens>('/token/refresh/', { refresh: refreshToken });

export const verify = (token: string) =>
  api.post('/token/verify/', { token });
