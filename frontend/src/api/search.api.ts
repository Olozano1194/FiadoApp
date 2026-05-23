import api from './axios.config';

export interface SearchResult {
  products: Array<{ id: number; name: string }>;
  clients: Array<{ id: number; name: string }>;
}

export const searchAll = (q: string) => api.get<SearchResult>('/search/', { params: { q } });
