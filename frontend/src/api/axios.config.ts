import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL_DEV || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Error de conexión';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default api;
