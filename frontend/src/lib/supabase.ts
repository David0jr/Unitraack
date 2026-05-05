import { createClient } from '@supabase/supabase-js';
import { getSubdomain, isAdminPath } from '../utils/subdomain';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Vite configs for Supabase are missing in .env!');
}

// Usamos uma chave de armazenamento global para que a sessão persista mesmo se o usuário 
// navegar entre diferentes caminhos de usinas (ex: /lins para /usina-lins).
const storageKey = `usinalins-auth-global`;

console.log(`[Supabase] Initializing with storageKey: ${storageKey} (Path: ${window.location.pathname})`);

// In the frontend, we use the Anon Key. The security is enforced by Row Level Security (RLS)
// inside the database, identifying the user from the JWT.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    storageKey: storageKey,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

