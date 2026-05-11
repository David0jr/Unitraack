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
import ParticleBackground from '../components/ParticleBackground';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-brand relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]"></div>
        
        <div className="bg-white/70 backdrop-blur-2xl p-12 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] max-w-md w-full text-center border border-white/50 animate-in zoom-in-95 duration-500 relative z-10">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner -rotate-3">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-navy uppercase tracking-tighter mb-4 leading-none">Ops! <span className="text-red-500 italic">Algo falhou</span></h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">{error}</p>
          <button 
            onClick={() => navigate(`/${tenantSlug || 'unknown'}/login`)}
            className="w-full py-5 bg-navy text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-xl shadow-navy/20 hover:-translate-y-1 transition-all"
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-brand relative overflow-hidden text-navy">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        
        <div className="bg-white/70 backdrop-blur-2xl p-12 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] max-w-md w-full text-center border border-white/50 animate-in zoom-in-95 duration-500 relative z-10 space-y-8">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner rotate-3">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold uppercase tracking-tighter leading-[0.9]">Ativação <span className="text-emerald-500 italic">Concluída!</span></h2>
            <p className="text-slate-500 text-sm font-medium">Sua conta de Gestor da <strong>{invitation?.tenant?.name}</strong> foi provisionada.</p>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Endereço de Acesso Local</p>
            <div className="p-5 bg-navy/[0.03] rounded-2xl border border-navy/5 flex items-center justify-between gap-4">
               <span className="text-[11px] font-bold text-primary lowercase truncate">
                 {window.location.host}/{invitation?.tenant?.subdomain}/login
               </span>
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(loginUrl);
                   alert('Portal link copiado com sucesso!');
                 }}
                 className="p-3 bg-white text-primary hover:bg-primary hover:text-white rounded-xl shadow-sm transition-all active:scale-90"
               >
                 <Copy className="w-4 h-4" />
               </button>
            </div>
          </div>

          <button 
            onClick={() => window.location.href = loginUrl}
            className="w-full py-6 bg-navy text-white font-bold uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-3 group shadow-xl shadow-navy/20 hover:-translate-y-1 transition-all"
          >
            Acessar Unidade <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-brand selection:bg-primary selection:text-white bg-slate-50">
      
      {/* Background Shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 md:bg-primary transform skew-x-[-20deg] translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-navy/5 md:bg-navy transform skew-y-[-10deg] translate-y-1/4"></div>
      </div>

      <div className="w-full max-w-5xl z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[580px] border border-white/20 backdrop-blur-sm">
          
          {/* Left Side - Identity */}
          <div className="w-full md:w-5/12 bg-navy p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex">
            <div className="absolute inset-0 opacity-40 mix-blend-screen">
              <ParticleBackground />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-black/40 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-auto">
                <img 
                  src={invitation?.tenant?.logo_url || "https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png"} 
                  alt={invitation?.tenant?.name || "Lins"} 
                  className="h-16 lg:h-20 object-contain brightness-0 invert mb-6" 
                />
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Acesso Gestor</span>
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed font-medium mb-8">
                  Provisionamento de acesso administrativo para a gestão de segurança e operações.
                </p>
                
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Protocolo Seguro &copy; 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-7/12 p-6 md:p-10 flex flex-col justify-center bg-white relative">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-8">
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-full tracking-widest">Habilitação Mestre</span>
                <h2 className="text-3xl font-bold text-navy uppercase tracking-tighter mt-6 mb-2 leading-none">Crie seu <span className="italic text-primary">Acesso</span></h2>
                <p className="text-slate-400 text-sm font-medium">Defina suas credenciais mestres para o sistema.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                <button 
                  type="submit" 
                  disabled={registering}
                  className="w-full py-4 mt-6 bg-navy text-white font-bold uppercase text-xs tracking-widest rounded-xl shadow-3xl shadow-navy/20 hover:bg-[#002880] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {registering ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      ATIVAR ACESSO GESTOR
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 text-center">
                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Unitraack Control &middot; Infraestrutura SaaS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ 
  label, 
  placeholder, 
  type = "text", 
  value, 
  onChange, 
  icon 
}: { 
  label: string, 
  placeholder?: string, 
  type?: string, 
  value: string, 
  onChange: (v: string) => void, 
  icon?: React.ReactNode 
}) {
  return (
    <div className="space-y-1.5 w-full group">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest leading-none group-focus-within:text-primary transition-colors">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">{icon}</div>
        <input 
          type={type}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-navy placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-sm"
        />
      </div>
    </div>
  );
}

