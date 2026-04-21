import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShieldCheck, LogIn, Loader2, LayoutDashboard } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Tentar Login Auth
      await login(email, password);

      // 2. Verificar se o usuário TEM o role SUPER_ADMIN antes de liberar o painel
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (profileError || !profile || profile.role !== 'SUPER_ADMIN') {
        throw new Error('Acesso negado. Esta página é restrita a Administradores Globais.');
      }

      navigate('/admin/painel');
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 font-brand relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        
        {/* Header Control */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-3xl border border-white/10 mb-6 backdrop-blur-xl">
            <LayoutDashboard className="w-8 h-8 text-primary shadow-xl" />
          </div>
          <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mb-2">INFRASTRUCTURE CONTROL</p>
          <h1 className="text-white text-2xl font-black uppercase tracking-tighter">SaaS Owner Login</h1>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[40px] shadow-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl flex items-start gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0"></span>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase ml-1 tracking-widest">Global Identity</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail de Operação"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase ml-1 tracking-widest">Security Token</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-[#009A94] text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <LogIn className="w-5 h-5" />
                  AUTHENTICATE OPERATOR
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-white/20 uppercase font-black text-[9px] tracking-[0.3em]">
             <ShieldCheck className="w-4 h-4" />
             End-to-End Encryption
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest"
          >
            ← Voltar para Acesso Corporativo
          </button>
        </div>
      </div>
    </div>
  );
}
