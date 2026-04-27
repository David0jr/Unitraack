import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

// Definição da tipagem do contexto
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithOtp: (email: string) => Promise<{ error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual no local storage nativo do supabase-js
    authService.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
      }
      setLoading(false);
    });

    // Escuta mudanças no Auth (Login, Logout)
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        setToken(session.access_token);
        localStorage.setItem('token', session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setToken(null);
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOtp = async (email: string) => {
    return await authService.signInWithOtp(email);
  };

  const signInWithPassword = async (email: string, password: string) => {
    return await authService.signInWithPassword(email, password);
  };
  const login = async (email: string, password: string) => {
    const { error } = await authService.signInWithPassword(email, password);
    if (error) throw error;
  };

  const signOut = async () => {
    await authService.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signInWithOtp, signInWithPassword, login, signOut }}>
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
