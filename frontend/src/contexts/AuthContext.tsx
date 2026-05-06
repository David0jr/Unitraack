import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../features/auth/api/authService';
import { supabase } from '../lib/supabase';
import { getTokenKey } from '../utils/subdomain';
import type { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

// Definição da tipagem do contexto
interface AuthContextType {
  user: User | null;
  profile: any | null;
  token: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithOtp: (email: string) => Promise<{ error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  login: (email: string, password: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, _setProfile] = useState<any | null>(null);
  const profileRef = React.useRef<any>(null);

  // Helper para atualizar estado e ref simultaneamente
  const setProfile = (data: any) => {
    profileRef.current = data;
    _setProfile(data);
  };

  // Usamos a chave de token do utilitário para consistência em toda a aplicação
  const tokenKey = getTokenKey();

  const [token, setToken] = useState<string | null>(sessionStorage.getItem(tokenKey));
  const [loading, setLoading] = useState(true);
  const fetchingProfile = React.useRef<Promise<any> | null>(null);

  const fetchProfile = async (userId: string, force = false) => {
    // Se já temos o perfil para este usuário e não é um force refresh, não buscamos de novo
    if (!force && profileRef.current?.id === userId) {
      return profileRef.current;
    }

    if (fetchingProfile.current) {
      console.log(`[Auth] Já existe uma busca de perfil em andamento, aguardando...`);
      return await fetchingProfile.current;
    }

    const fetchPromise = (async () => {
      const startTime = Date.now();
      console.log(`[Auth] Buscando perfil para o usuário: ${userId}...`);
      
      try {
        // Define um timeout para a consulta ao Supabase
        const profileRequest = supabase
          .from('profiles')
          .select('id, role, full_name, tenant_id')
          .eq('id', userId)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database Request Timeout (15s)')), 15000)
        );

        const { data: initialData, error: profileError } = await Promise.race([
          profileRequest,
          timeoutPromise as any
        ]);

        let profileData = initialData;

        if (profileError) {
          // Se for erro de timeout ou lock stolen mas já temos o perfil, ignoramos o erro
          const isConcurrencyError = profileError.message?.includes('Timeout') || profileError.message?.includes('Lock');
          if (isConcurrencyError && profileRef.current) {
            console.warn('[Auth] Erro de concorrência ou timeout, mas já possuímos dados locais. Mantendo perfil atual.');
            return profileRef.current;
          }
          throw profileError;
        }

        // Se não encontrar o perfil de primeira, tenta mais uma vez após um pequeno delay
        // Isso ajuda se houver um micro-atraso na criação do perfil via backend/trigger
        if (!profileData) {
          console.warn(`[Auth] Perfil não encontrado para o ID ${userId}. Tentando novamente em 1.5s...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('id, role, full_name, tenant_id')
            .eq('id', userId)
            .maybeSingle();
            
          if (retryError) throw retryError;
          profileData = retryData;
        }

        if (!profileData) {
          console.error(`[Auth] ERRO FATAL: O usuário ${userId} (${user?.email}) está autenticado no Auth, mas não existe na tabela 'profiles'.`);
          setProfile(null);
          return null;
        }

        // Carrega dados do tenant (necessário para navegação correta no login)
        if (profileData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profileData.tenant_id)
            .maybeSingle();
            
          if (tenantData) {
            profileData.tenant = tenantData;
          }
        }

        const duration = Date.now() - startTime;
        console.log(`[Auth] Perfil carregado com sucesso (${duration}ms):`, profileData.role);
        
        setProfile(profileData);
        return profileData;
      } catch (err: any) {
        // Erro de lock stolen do Supabase é comum em concorrência
        const isLockError = err.message?.includes('Lock') || err.message?.includes('released');
        
        if (isLockError) {
          if (profileRef.current) {
            console.warn('[Auth] Lock error detectado, mas perfil já existe. Ignorando.');
            return profileRef.current;
          }
          
          console.warn('[Auth] Lock error detectado na primeira busca. Tentando novamente em 500ms...');
          await new Promise(r => setTimeout(r, 500));
          // Ao retornar null aqui após o erro, permitimos que a lógica de "onAuthStateChange" 
          // ou a próxima chamada tente novamente de forma limpa
        }

        console.error('[Auth] Erro ao buscar perfil:', err.message || err);
        if (!profileRef.current || err.message?.includes('not found')) {
          setProfile(null);
        }
        return null;
      } finally {
        fetchingProfile.current = null;
      }
    })();

    fetchingProfile.current = fetchPromise;
    return await fetchPromise;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, true);
  };

  useEffect(() => {
    let mounted = true;
    const isInitialLoad = { current: true };

    // Safety timeout: prevents infinite loading if Supabase connection hangs
    const safeTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[Auth] Initialization timed out (10s). Forcing UI to render.');
        setLoading(false);
        isInitialLoad.current = false;
      }
    }, 10000);

    const initSession = async () => {
      try {
        console.log('[Auth] Initializing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('[Auth] Error fetching session:', error);

        if (mounted) setUser(session?.user ?? null);

        if (session?.user) {
          // If fetchProfile hangs, we don't want to block UI infinitely, but we still await
          // We rely on the safeTimeout to unlock the UI if it takes too long
          await fetchProfile(session.user.id);
        }

        if (session?.access_token && mounted) {
          setToken(session.access_token);
          sessionStorage.setItem(tokenKey, session.access_token);
        }
      } catch (err) {
        console.error('Erro ao inicializar sessão:', err);
      } finally {
        if (mounted) {
          clearTimeout(safeTimeout);
          setLoading(false);
          isInitialLoad.current = false;
        }
      }
    };

    initSession();

    // Escuta mudanças no Auth (Login, Logout)
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Evento de autenticação: ${event}`);
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;

      try {
        const newUser = session?.user ?? null;
        setUser(newUser);

        if (newUser) {
          // Se o usuário mudou ou o perfil ainda não existe, buscamos
          // Pequeno delay para evitar lock contention com o processo interno do Supabase
          setTimeout(async () => {
            if (!profileRef.current || profileRef.current.id !== newUser.id) {
              await fetchProfile(newUser.id);
            }
          }, 100);
        } else {
          setProfile(null);
        }

        if (session?.access_token) {
          setToken(session.access_token);
          sessionStorage.setItem(tokenKey, session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setToken(null);
          sessionStorage.removeItem(tokenKey);
        }

      } catch (err) {
        console.error('Erro na mudança de estado auth:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safeTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = async (email: string) => {
    return await authService.signInWithOtp(email);
  };

  const signInWithPassword = async (email: string, password: string) => {
    return await authService.signInWithPassword(email, password);
  };
  const login = async (email: string, password: string) => {
    const { data: { user }, error } = await authService.signInWithPassword(email, password);
    if (error) throw error;
    if (user) {
      // Use optimized fetch logic and return the result
      return await fetchProfile(user.id);
    }
    return null;
  };

  const signOut = async () => {
    await authService.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, profile, token, loading,
      signInWithOtp, signInWithPassword, login, signOut,
      refreshProfile
    }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-10 h-10 text-primary animate-spin opacity-20" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
