import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { LogIn, UserPlus, ShieldCheck, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { tenant, isSubdomain } = useTenant();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      // Mantém o slug da usina na URL se não estiver usando subdomínio native
      if (tenant && !isSubdomain) {
        navigate(`/${tenant.subdomain}/painel`);
      } else {
        navigate('/painel');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-brand antialiased selection:bg-primary selection:text-white">
      
      {/* Sidebar Elegante */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-16 bg-navy relative overflow-hidden">
        {/* Fundo Decorativo Sutil */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-primary/10 to-transparent rounded-full -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative z-10">
          <img 
            src={tenant?.logo_url || "https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png"} 
            alt={tenant?.name || "Lins Agroindustrial"} 
            className={`h-10 object-contain mb-16 ${!tenant?.logo_url && 'brightness-0 invert'}`} 
          />
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
            Portal de <br/><span className="text-primary font-serif italic font-medium">Acesso</span>
          </h1>
          <p className="text-slate-300 mt-6 text-lg max-w-sm leading-relaxed">
            Acesse o sistema da <strong>{tenant?.name || 'Usina'}</strong> para gerenciar suas entregas e operações diárias.
          </p>
        </div>

        <div className="relative z-10 pt-10 border-t border-white/10">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Plataforma de Segurança Multilocatária</p>
        </div>
      </div>

      {/* Área do Formulário */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-24 bg-slate-50/30">
        <div className="max-w-md w-full mx-auto">
          
          {/* Mobile Vista */}
          <div className="mb-10 lg:hidden text-center">
            <img 
              src={tenant?.logo_url || "https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png"} 
              alt={tenant?.name || "Lins"} 
              className="h-10 object-contain mx-auto mb-8" 
            />
            <h2 className="text-3xl font-black text-navy tracking-tight">Portal de Acesso</h2>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-black text-navy tracking-tight mb-2">Bem-vindo(a)</h2>
            <p className="text-slate-500 text-sm">Insira suas credenciais corporativas para acessar o painel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2 w-full">
                <label className="text-xs font-semibold text-slate-600 block pl-1">E-mail Corporativo</label>
                <div className="relative">
                  <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-navy placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm shadow-sm"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2 w-full">
                <label className="text-xs font-semibold text-slate-600 block pl-1">Senha de Acesso</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-navy placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm shadow-sm"
                    required 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-8 bg-navy hover:bg-[#001f4d] text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(0,31,77,0.5)] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Acessar Painel
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-slate-200/60">
            <p className="text-sm text-slate-500">
              Não possui uma entidade cadastrada?
            </p>
            <Link 
              to={`/${tenant?.subdomain || 'unknown'}/cadastro`} 
              className="inline-flex items-center gap-2 mt-3 text-primary font-bold hover:underline transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Cadastre sua empresa
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
