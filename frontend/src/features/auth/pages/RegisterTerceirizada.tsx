import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2, CheckCircle2, ShieldAlert, Building2, UserCircle2, Phone, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { maskCNPJ, maskPhone, validateEmail } from '../../../utils/masks';
import { useTenant } from '../../../contexts/TenantContext';
import ParticleBackground from '../components/ParticleBackground';

export default function RegisterTerceirizada() {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading, slug } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '', // Nome da Empresa
    representativeName: '', // Representante
    cnpj: '',
    phone: ''
  });

  const handlePhoneChange = (v: string) => setFormData({ ...formData, phone: maskPhone(v) });
  const handleCnpjChange = (v: string) => setFormData({ ...formData, cnpj: maskCNPJ(v) });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Formato de e-mail inválido.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-Slug': tenant?.subdomain || slug || ''
        },
        body: JSON.stringify({ ...formData, role: 'TERCEIRIZADA' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao realizar cadastro.');

      setSuccess(true);
      setTimeout(() => navigate(`/${tenant?.subdomain || slug || 'unknown'}/login`), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin opacity-20" />
      </div>
    );
  }

  // Removida a restrição agressiva para permitir cadastro mesmo que o tenant não esteja totalmente carregado (usa o slug da URL)
  // Mas ainda mostramos um aviso se não houver contexto nenhum
  if (!slug && !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-brand">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-4">Link de Cadastro Inválido</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
            Para se cadastrar, você deve acessar o link exclusivo fornecido pela Usina contratante.
          </p>
          <Link to="/" className="text-primary font-bold hover:underline">Ir para Home</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-brand">
        <div className="bg-white p-12 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-navy mb-3 tracking-tight">Cadastro Concluído!</h2>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            Sua empresa foi cadastrada no sistema <strong>{tenant?.name || 'Usina'}</strong> com sucesso.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-primary font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecionando para o login...
          </div>
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

      <div className="w-full max-w-6xl z-10">
        
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[650px] border border-white/20 backdrop-blur-sm">
          
          {/* Left Side - Identity (Same as Login) */}
          <div 
            className="w-full md:w-5/12 bg-navy p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex transition-colors duration-500"
            style={{ backgroundColor: tenant?.tertiary_color || undefined }}
          >
            
            {/* Particle Canvas */}
            <div className="absolute inset-0 opacity-40 mix-blend-screen">
              <ParticleBackground />
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-black/40 pointer-events-none"></div>

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

              <div className="relative z-10 my-10">
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                  Portal do <br/>
                  <span className="text-primary font-serif italic font-medium">Fornecedor</span>
                </h1>
                <p className="text-slate-300 text-base max-w-sm leading-relaxed font-medium">
                  Realize seu credenciamento para gerenciar operações na <strong className="text-white">{tenant?.name || 'Usina Lins'}</strong> de forma ágil e segura.
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Lins Agroindustrial &copy; 2026</p>
              </div>
            </div>
          </div>

          {/* Right Side - Form (More Compact) */}
          <div className="w-full md:w-7/12 p-8 lg:p-12 flex flex-col justify-center bg-white relative overflow-y-auto max-h-[90vh] md:max-h-none">
            
            <div className="mb-8">
              <div className="w-12 h-1.5 bg-primary mb-4 rounded-full"></div>
              <h2 className="text-3xl font-bold text-navy tracking-tight mb-2">Cadastre sua Empresa</h2>
              <p className="text-slate-500 text-sm font-medium">Preencha os dados abaixo para iniciar sua parceria.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InputGroup 
                    label="Razão Social" 
                    icon={Building2}
                    value={formData.fullName} 
                    onChange={v => setFormData({...formData, fullName: v})} 
                    placeholder="Nome da sua empresa" 
                  />
                </div>

                <InputGroup 
                  label="CNPJ" 
                  icon={ShieldCheck}
                  value={formData.cnpj} 
                  onChange={handleCnpjChange} 
                  placeholder="00.000.000/0000-00" 
                />
                
                <InputGroup 
                  label="Telefone" 
                  icon={Phone}
                  value={formData.phone} 
                  onChange={handlePhoneChange} 
                  placeholder="(00) 00000-0000" 
                />

                <InputGroup 
                  label="Nome do Responsável" 
                  icon={UserCircle2}
                  value={formData.representativeName} 
                  onChange={v => setFormData({...formData, representativeName: v})} 
                  placeholder="Nome completo" 
                />

                <InputGroup 
                  label="E-mail Corporativo" 
                  icon={Mail}
                  type="email" 
                  value={formData.email} 
                  onChange={v => setFormData({...formData, email: v})} 
                  placeholder="empresa@exemplo.com.br" 
                />

                <InputGroup 
                  label="Senha" 
                  icon={Lock}
                  type="password" 
                  value={formData.password} 
                  onChange={v => setFormData({...formData, password: v})} 
                  placeholder="••••••••" 
                />

                <InputGroup 
                  label="Confirmar Senha" 
                  icon={Lock}
                  type="password" 
                  value={formData.confirmPassword} 
                  onChange={v => setFormData({...formData, confirmPassword: v})} 
                  placeholder="••••••••" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 mt-6 bg-navy hover:bg-[#001D4A] text-white font-bold rounded-xl shadow-xl shadow-navy/10 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 uppercase tracking-widest text-xs group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Finalizar Credenciamento
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-slate-50">
              <p className="text-xs text-slate-400 font-bold">
                Já possui uma conta? 
                <Link to={`/${tenant?.subdomain || slug || 'unknown'}/login`} className="ml-2 text-primary hover:underline">
                  Fazer Login
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

interface InputProps {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon: any;
}

function InputGroup({ label, placeholder, type = "text", value, onChange, icon: Icon }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 group">
      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1 transition-colors group-focus-within:text-primary">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-all" />
        <input 
          type={currentType}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-11 py-3 bg-slate-50 border border-slate-100 rounded-xl text-navy font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xs shadow-inner ${isPassword ? 'pr-11' : 'pr-4'}`}
        />
        {isPassword && (
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

