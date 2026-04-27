import { supabase } from '../lib/supabase';

export const authService = {
  async getSession() {
    return await supabase.auth.getSession();
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async signInWithOtp(email: string) {
    return await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/painel`
      } 
    });
  },

  async signInWithPassword(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};
