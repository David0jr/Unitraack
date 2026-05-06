import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

import { Lock, LogIn, Loader2, UserCircle2 } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';

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
      const startTime = Date.now();
      console.log('[Login] Iniciando autenticação administrativa...');

      // Usar a função de login do contexto que já gerencia o perfil de forma otimizada
      const profile = await login(email, password);
      
      const duration = Date.now() - startTime;
      console.log(`[Login] Autenticação e perfil concluídos em ${duration}ms`);

      if (!profile || profile.role !== 'SUPER_ADMIN') {
        throw new Error('Acesso negado. Esta página é restrita a Administradores Globais.');
      }

      console.log('[Login] Sucesso! Redirecionando para o painel...');
      navigate('/admin/painel');
    } catch (err: any) {
      console.error('[Login] Erro:', err);
      setError(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background Shapes */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#10C99E] transform skew-x-[-20deg] translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#7C5CFF] transform skew-y-[-10deg] translate-y-1/4"></div>
      </div>

      <div className="w-full max-w-5xl z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#2D3A4B]">Unitraack</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Left Side - Illustration / Particle Background */}
          <div className="w-full md:w-1/2 bg-[#F8FAFF] p-12 flex items-center justify-center relative overflow-hidden hidden md:flex">
            {/* Particle Canvas */}
            <ParticleBackground />

            {/* Company Name Overlay */}
            <div className="relative z-10 flex flex-col items-center pointer-events-none">
              <h1 className="text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFF] to-[#10C99E] text-center drop-shadow-md leading-tight tracking-wide">
                Unitraack
              </h1>
            </div>

            {/* Divider Line (Visible only on desktop) */}
            <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            <div className="mb-8">
              <div className="w-10 h-1 bg-[#7C5CFF] mb-4"></div>
              <h2 className="text-2xl font-bold text-[#2D3A4B]">Admin</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@gmail.com"
                    className="w-full px-5 py-4 bg-[#F8FAFF] border border-slate-100 rounded-2xl text-[#2D3A4B] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/20 focus:border-[#7C5CFF] transition-all pr-12"
                    required
                  />
                  <UserCircle2 className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                </div>

                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-[#F8FAFF] border border-slate-100 rounded-2xl text-[#2D3A4B] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/20 focus:border-[#7C5CFF] transition-all pr-12"
                    required
                  />
                  <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#7C5CFF] hover:bg-[#6A4BE0] text-white font-bold rounded-2xl shadow-lg shadow-purple-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 uppercase tracking-widest text-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    LOGIN
                    <LogIn className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

