import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTenant } from '../../../contexts/TenantContext';
import { UserPlus, Loader2, ArrowRight, ShieldAlert, UserCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signOut, user, profile, loading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggingIn = useRef(false);

  // SECURITY: Se o usuário chegar nesta página já estando logado (ex: via botão 'Voltar'), 
  // forçamos o logout para proteger a rota e impedir o re-ingresso via botão 'Avançar'.
  useEffect(() => {
    if (!authLoading && user && profile && !isLoggingIn.current) {
      console.warn('[Login] Sessão ativa detectada na página de login. Invalidando sessão para proteção...');
      signOut();
    }
  }, [user, profile, authLoading, signOut]);

  useEffect(() => {
    const state = location.state as { error?: string } | null;
    if (state?.error) {
      setError(state.error);
      // Limpa o estado para não re-exibir ao dar refresh se não necessário
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      isLoggingIn.current = true;
      // 10 second timeout for the entire login process
      const loginPromise = login(email, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tempo de resposta excedido. Verifique sua conexão.')), 10000)
      );

      const profile = await Promise.race([loginPromise, timeoutPromise]) as any;
      
      // 1. Verificação de Isolamento de Portais
      const isTenantPortal = !!tenant?.subdomain;
      const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

      // BLOQUEIO: Super Admin tentando entrar pelo portal da usina
      if (isTenantPortal && isSuperAdmin) {
        isLoggingIn.current = false;
        await signOut();
        setError('Acesso negado: Administradores devem usar o portal administrativo exclusivo.');
        setLoading(false);
        return;
      }

      // BLOQUEIO: Usuário comum tentando entrar pelo portal administrativo
      if (!isTenantPortal && !isSuperAdmin) {
        isLoggingIn.current = false;
        await signOut();
        setError('Acesso negado: Use o link oficial da sua usina para acessar o sistema.');
        setLoading(false);
        return;
      }

      // 2. Se for Super Admin, vai para o painel global (apenas se não estiver no portal da usina)
      if (isSuperAdmin) {
        navigate('/admin/painel');
        return;
      }

      // 3. Redirecionamento de Usuários de Usina
      const userTenantSlug = profile?.tenant?.subdomain;
      
      if (userTenantSlug) {
        const rolePath = profile?.role?.toLowerCase().replace('_', '-');
        navigate(`/${userTenantSlug}/${rolePath}/painel`);
      } else if (tenant?.subdomain) {
        const rolePath = profile?.role?.toLowerCase().replace('_', '-');
        navigate(`/${tenant.subdomain}/${rolePath}/painel`);
      } else {
        navigate('/painel');
      }
    } catch (err: any) {
      isLoggingIn.current = false;
      console.error('[Login] Erro:', err);
      
      let friendlyMessage = err.message || 'Credenciais inválidas.';
      
      if (friendlyMessage.includes('Invalid login credentials')) {
        friendlyMessage = 'E-mail ou senha incorretos.';
      } else if (friendlyMessage.includes('desativada')) {
        friendlyMessage = 'Sua conta está desativada. Fale com o gestor de segurança.';
      } else if (friendlyMessage.includes('Too many requests')) {
        friendlyMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
      } else if (friendlyMessage.includes('Failed to fetch') || friendlyMessage.includes('network')) {
        friendlyMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }

      console.log('[Login] Definindo erro amigável:', friendlyMessage);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-brand selection:bg-primary selection:text-white bg-slate-50">
      
      {/* Background Shapes (Inspirado no Admin, mas com cores da Lins) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 md:bg-primary transform skew-x-[-20deg] translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-navy/5 md:bg-navy transform skew-y-[-10deg] translate-y-1/4"></div>
      </div>

      <div className="w-full max-w-5xl z-10">
        
        {/* Logo Section (Mobile Only) */}
        <div className="flex flex-col items-center mb-8 lg:hidden">
           <img 
              src={tenant?.logo_url || "https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png"} 
              alt={tenant?.name || "Lins"} 
              className="h-8 object-contain mb-2" 
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-navy/60">Portal de Acesso</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px] border border-white/20 backdrop-blur-sm">
          
          {/* Left Side - Identity / Particle Background (Inspirado no Admin) */}
          <div className="w-full md:w-1/2 bg-navy p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex">
            
            {/* Particle Canvas */}
            <div className="absolute inset-0 opacity-40 mix-blend-screen">
              <ParticleBackground />
            </div>

            {/* Decorative Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-black/40 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full">
              {/* Logo Section - Much larger as requested */}
              <div className="mb-auto">
                <img 
                  src={tenant?.logo_url || "https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png"} 
                  alt={tenant?.name || "Lins"} 
                  className="h-20 lg:h-32 object-contain brightness-0 invert mb-6 transition-all" 
                />
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Portal Oficial de Segurança</span>
                </div>
              </div>

              {/* Description - Moved to the bottom near the credits */}
              <div className="mt-auto">
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed font-medium mb-6">
                  Acesse o sistema da <strong className="text-white/90">{tenant?.name || 'Usina Lins'}</strong> para gerenciar suas entregas e operações diárias.
                </p>
                
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Lins Agroindustrial &copy; 2026</p>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider Line (Visible only on desktop) */}
            <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white relative">
            
            <div className="mb-8">
              <div className="w-12 h-1.5 bg-primary mb-4 rounded-full shadow-lg shadow-primary/20"></div>
              <h2 className="text-3xl font-bold text-navy tracking-tight mb-2">Bem-vindo(a)</h2>
              <p className="text-slate-500 text-sm font-medium">Insira suas credenciais corporativas para acessar o painel.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1 transition-colors group-focus-within:text-primary">E-mail Corporativo</label>
                  <div className="relative">
                    <UserCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-all" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com.br"
                      className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-navy font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm shadow-inner"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1 transition-colors group-focus-within:text-primary">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-all" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-navy font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm shadow-inner"
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 mt-2 bg-navy hover:bg-[#001D4A]/90 text-white font-bold rounded-xl shadow-xl shadow-navy/20 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 uppercase tracking-widest text-xs group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Acessar Painel
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-slate-50">
              <p className="text-xs text-slate-400 font-bold">
                Não possui uma entidade cadastrada?
              </p>
              <Link 
                to={`/${tenant?.subdomain || 'unknown'}/cadastro`} 
                className="inline-flex items-center gap-2 mt-3 text-primary font-bold hover:text-primary/80 transition-all group relative"
              >
                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-xs">Cadastre sua empresa</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

