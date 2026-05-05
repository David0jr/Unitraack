import axios from 'axios';
import { getSubdomain, isAdminPath, getTokenKey } from '../utils/subdomain';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
});

// Interceptor para adicionar o token de autorização em todas as requisições
api.interceptors.request.use(
  (config) => {
    const tokenKey = getTokenKey();
    
    const token = sessionStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

