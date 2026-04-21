import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Vite configs for Supabase are missing in .env!');
}

// In the frontend, we use the Anon Key. The security is enforced by Row Level Security (RLS)
// inside the database, identifying the user from the JWT.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
