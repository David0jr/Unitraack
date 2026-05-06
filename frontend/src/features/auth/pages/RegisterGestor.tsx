import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Copy
} from 'lucide-react';
import { getSubdomain } from '../../../utils/subdomain';

export default function RegisterGestor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setError('Token de convite não encontrado.');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/auth/invitation/${token}`, {
          headers: {
            'X-Tenant-Slug': tenantSlug || getSubdomain() || ''
          }
        });
        const data = await resp.json();
        
        if (resp.ok) {
          setInvitation(data);
        } else {
          setError(data.error || 'Convite inválido ou expirado.');
        }
      } catch (err) {
        setError('Erro ao conectar com o servidor.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, tenantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    setRegistering(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/auth/register-gestor`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-Slug': tenantSlug || getSubdomain() || ''
        },
        body: JSON.stringify({
          token,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      });

      if (resp.ok) {
        setSuccess(true);
      } else {
        const d = await resp.json();
        alert(d.error);
      }
    } catch (err) {
      alert('Erro ao realizar cadastro.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6 font-brand relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]"></div>
        
        <div className="bg-white/70 backdrop-blur-2xl p-12 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] max-w-md w-full text-center border border-white/50 animate-in zoom-in-95 duration-500 relative z-10">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner -rotate-3">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-navy uppercase tracking-tighter mb-4 leading-none">Ops! <span className="text-red-500 italic">Algo falhou</span></h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">{error}</p>
          <button 
            onClick={() => navigate(`/${tenantSlug || 'unknown'}/login`)}
            className="w-full py-5 bg-navy text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-navy/20 hover:-translate-y-1 transition-all"
          >
            Retornar ao Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    const loginUrl = `${window.location.protocol}//${window.location.host}/${invitation?.tenant?.subdomain}/login`;
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6 font-brand relative overflow-hidden text-navy">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        
        <div className="bg-white/70 backdrop-blur-2xl p-12 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] max-w-md w-full text-center border border-white/50 animate-in zoom-in-95 duration-500 relative z-10 space-y-8">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-2 shadow-inner rotate-3">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-[0.9]">Ativação <span className="text-emerald-500 italic">Concluída!</span></h2>
            <p className="text-slate-500 text-sm font-medium">Sua conta de Gestor da <strong>{invitation?.tenant?.name}</strong> foi provisionada.</p>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Endereço de Acesso Local</p>
            <div className="p-5 bg-navy/[0.03] rounded-3xl border border-navy/5 flex items-center justify-between gap-4">
               <span className="text-[11px] font-black text-primary lowercase truncate">
                 {window.location.host}/{invitation?.tenant?.subdomain}/login
               </span>
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(loginUrl);
                   alert('Portal link copiado com sucesso!');
                 }}
                 className="p-3 bg-white text-primary hover:bg-primary hover:text-white rounded-2xl shadow-sm transition-all active:scale-90"
               >
                 <Copy className="w-4 h-4" />
               </button>
            </div>
          </div>

          <button 
            onClick={() => window.location.href = loginUrl}
            className="w-full py-6 bg-navy text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 group shadow-2xl shadow-navy/20 hover:-translate-y-1 transition-all"
          >
            Acessar Unidade <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white flex flex-col font-brand antialiased text-navy">
      <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-12 bg-white overflow-hidden">
        
        {/* Banner Lateral */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between p-16 bg-navy text-white relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -ml-32 -mb-32"></div>
          
          <div className="relative z-10">
             <div className="bg-white/10 backdrop-blur-md inline-block p-4 rounded-2xl mb-12 border border-white/10">
               <img 
                 src={invitation?.tenant?.logo_url || "https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png"} 
                 alt={invitation?.tenant?.name || "Lins"} 
                 className={`h-8 object-contain ${!invitation?.tenant?.logo_url && 'brightness-0 invert'}`} 
               />
             </div>

             
             <div className="space-y-8">
               <div className="w-16 h-16 bg-primary/20 backdrop-blur-xl text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                 <ShieldCheck className="w-8 h-8" />
               </div>
               <div>
                  <h1 className="text-5xl font-black mb-4 leading-[0.9] uppercase tracking-tighter max-w-xs">
                    Portal do <span className="text-primary italic">Gestor</span>
                  </h1>
                  <p className="text-blue-100/60 text-lg max-w-sm leading-relaxed">
                    Provisionamento de acesso administrativo para a unidade <strong>{invitation?.tenant?.name}</strong>.
                  </p>
               </div>
             </div>
          </div>

          <div className="relative z-10">
             <div className="space-y-3 pt-10 border-t border-white/10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Protocolo de Segurança Ativo</p>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Identidade Digital Monitorada</p>
             </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="md:col-span-7 p-8 md:p-20 overflow-y-auto flex flex-col justify-center bg-[#F8FAFC]">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-12">
               <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full tracking-[0.2em]">Habilitação de Segurança</span>
               <h2 className="text-4xl font-black text-navy uppercase tracking-tighter mt-6 mb-2 leading-none">Crie seu <span className="italic text-primary">Acesso</span></h2>
               <p className="text-slate-400 font-medium">Defina suas credenciais mestres para o sistema.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <InputGroup 
                  label="Nome Completo para Registro" 
                  icon={<UserIcon className="w-4 h-4" />} 
                  value={formData.fullName} 
                  onChange={(v: string) => setFormData({...formData, fullName: v})} 
                  placeholder="Seu nome profissional" 
                />
                
                <InputGroup 
                  label="E-mail de Vinculação" 
                  icon={<Mail className="w-4 h-4" />} 
                  value={formData.email} 
                  onChange={(v: string) => setFormData({...formData, email: v})} 
                  placeholder="seu@email.com" 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup 
                    label="Chave de Acesso" 
                    icon={<Lock className="w-4 h-4" />} 
                    type="password" 
                    value={formData.password} 
                    onChange={(v: string) => setFormData({...formData, password: v})} 
                    placeholder="••••••••" 
                  />
                  <InputGroup 
                    label="Repetir Chave" 
                    icon={<ShieldCheck className="w-4 h-4" />} 
                    type="password" 
                    value={formData.confirmPassword} 
                    onChange={(v: string) => setFormData({...formData, confirmPassword: v})} 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={registering}
                className="w-full py-6 bg-navy text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-3xl shadow-navy/20 hover:bg-[#002880] transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-10"
              >
                {registering ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    ATIVAR ACESSO GESTOR
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Lins Control &middot; Infraestrutura SaaS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, placeholder, type = "text", value, onChange, icon }: any) {
  return (
    <div className="space-y-1.5 w-full group">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest leading-none">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">{icon}</div>
        <input 
          type={type}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-navy placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-sm"
        />
      </div>
    </div>
  );
}

