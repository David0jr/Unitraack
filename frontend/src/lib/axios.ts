import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
});

// Interceptor para adicionar o token de autorização em todas as requisições
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let activeSession = session;

      if (activeSession) {
        // Se o token estiver expirado ou prestes a expirar nos próximos 10 segundos
        const isExpired = activeSession.expires_at 
          ? (activeSession.expires_at * 1000) < Date.now() + 10000 
          : false;

        if (isExpired) {
          console.log('[Axios Interceptor] Token expirado detectado. Renovando sessão antes do envio da requisição...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshedSession) {
            activeSession = refreshedSession;
          }
        }
      }

      if (activeSession?.access_token) {
        config.headers.Authorization = `Bearer ${activeSession.access_token}`;
      }
    } catch (error) {
      console.error('[Axios Interceptor] Erro ao obter sessão do Supabase:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


