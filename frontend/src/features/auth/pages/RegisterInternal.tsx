import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  AlertCircle,
  User as UserIcon,
  Mail,
  Building2,
  LayoutGrid,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';
import { maskCNPJ, validateEmail } from '../../../utils/masks';
import { useTenant } from '../../../contexts/TenantContext';
import ParticleBackground from '../components/ParticleBackground';

type Role = 'GESTOR_SEGURANCA' | 'LIDER_SETOR' | 'PORTARIA';

export default function RegisterInternal() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidInvite, setIsValidInvite] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    registrationNumber: '',
    sector: '',
    sector_id: '',
    usinaCnpj: '',
    usinaName: ''
  });

  useEffect(() => {
    const roleParam = searchParams.get('role') as Role;
    const sectorParam = searchParams.get('sector');
    const cnpjParam = searchParams.get('cnpj');

    if (roleParam) {
      setRole(roleParam);
      setFormData(prev => ({
        ...prev,
        sector: sectorParam || '',
        sector_id: searchParams.get('sector_id') || '',
        usinaCnpj: cnpjParam ? maskCNPJ(cnpjParam) : (tenant?.cnpj ? maskCNPJ(tenant.cnpj) : prev.usinaCnpj)
      }));
      setIsValidInvite(true);
    } else {
      setIsValidInvite(false);
    }
  }, [searchParams, tenant]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      setError('Formato de e-mail inválido.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-Slug': tenantSlug || ''
        },
        body: JSON.stringify({ ...formData, role })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro no cadastro interno.');

      setSuccess(true);
      setTimeout(() => navigate(`/${tenantSlug || 'unknown'}/login`), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (isValidInvite === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-brand">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2 uppercase tracking-tighter">ACESSO RESTRITO</h2>
          <p className="text-slate-400 font-medium mb-8">Esta página requer um link de convite válido gerado pelo Gestor de Segurança.</p>
          <button 
            onClick={() => navigate(`/${tenantSlug || 'unknown'}/login`)}
            className="w-full py-4 bg-navy text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-navy/90 transition-all"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-2 uppercase tracking-tighter">CONTA ATIVADA!</h2>
          <p className="text-slate-500 font-medium">Seu acesso à equipe Lins Agroindustrial foi configurado com sucesso.</p>
          <p className="text-[10px] text-slate-300 mt-6 uppercase font-bold tracking-widest">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (isValidInvite === null) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
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
                <div className="h-16 lg:h-20 flex items-center mb-6">
                  {tenant?.logo_url ? (
                    <img 
                      src={tenant.logo_url} 
                      alt={tenant?.name || "Logo"} 
                      className="max-h-full max-w-[200px] object-contain drop-shadow-md" 
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {tenant?.name?.[0] || 'U'}
                      </div>
                      <span className="text-white font-black text-xl tracking-tight uppercase">{tenant?.name || 'Usina'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed font-medium mb-8">
                  Finalize o cadastro da sua conta administrativa vinculada à planta via convite oficial.
                </p>
                
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Segurança Ativa &copy; 2026</p>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-7/12 p-6 md:p-10 flex flex-col justify-center bg-white relative">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic">DADOS DO CONVITE</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-navy uppercase tracking-tighter">{role?.replace('_', ' ')}</h2>
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[11px] font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="grid gap-4">
                  <InputGroup 
                    label="Seu Nome Completo" 
                    icon={<UserIcon className="w-4 h-4" />}
                    value={formData.fullName} 
                    onChange={v => setFormData({...formData, fullName: v})} 
                    placeholder="Ex: Lucas Ferreira" 
                  />
                  
                  <InputGroup 
                    label="Número de Matrícula" 
                    icon={<Hash className="w-4 h-4" />}
                    value={formData.registrationNumber} 
                    onChange={v => setFormData({...formData, registrationNumber: v})} 
                    placeholder="Ex: 123456" 
                  />
                  
                  <InputGroup 
                    label="E-mail Usina" 
                    icon={<Mail className="w-4 h-4" />}
                    type="email" 
                    value={formData.email} 
                    onChange={v => setFormData({...formData, email: v})} 
                    placeholder="seu.nome@linsagro.com.br" 
                  />
                  
                  <InputGroup 
                    label="Senha de Acesso" 
                    icon={<Lock className="w-4 h-4" />}
                    type="password" 
                    value={formData.password} 
                    onChange={v => setFormData({...formData, password: v})} 
                    placeholder="••••••••" 
                  />
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <InputGroup 
                      label="CNPJ da Unidade" 
                      icon={<Building2 className="w-4 h-4" />}
                      value={formData.usinaCnpj} 
                      onChange={() => {}} 
                      disabled={true}
                    />
                    {role === 'LIDER_SETOR' && (
                        <InputGroup 
                          label="Setor" 
                          icon={<LayoutGrid className="w-4 h-4" />}
                          value={formData.sector} 
                          onChange={() => {}} 
                          disabled={true}
                        />
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 mt-4 bg-navy hover:bg-[#001D4A]/90 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-navy/20 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 group"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Confirmar e Ativar Conta
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                
                <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                  Cadastro monitorado pela segurança patrimonial
                </p>
              </form>
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
  disabled = false,
  icon
}: { 
  label: string, 
  placeholder?: string, 
  type?: string, 
  value: string, 
  onChange: (v: string) => void, 
  disabled?: boolean,
  icon?: React.ReactNode
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 w-full group">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest transition-colors group-focus-within:text-primary">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input 
          type={currentType}
          required
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-11' : 'px-5'} py-3 border rounded-xl text-navy placeholder-slate-300 focus:outline-none transition-all font-bold text-sm ${
            disabled 
              ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-50/50 border-slate-100 focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white'
          } ${isPassword ? 'pr-11' : 'pr-5'}`}
        />
        {isPassword && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary focus:outline-none p-1 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

