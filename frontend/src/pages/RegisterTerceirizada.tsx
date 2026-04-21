import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { maskCNPJ, maskPhone, validateEmail } from '../utils/masks';
import { useTenant } from '../contexts/TenantContext';

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
      const response = await fetch('http://localhost:3333/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-Slug': tenant?.subdomain || ''
        },
        body: JSON.stringify({ ...formData, role: 'TERCEIRIZADA' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao realizar cadastro.');

      setSuccess(true);
      setTimeout(() => navigate(`/${tenant?.subdomain || 'unknown'}/login`), 3000);
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

  // Se não houver subdomínio ou a usina não for encontrada, bloqueia o acesso
  if (!slug || !tenant) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-brand">
        <div className="max-w-md w-full bg-white p-12 rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-4">Acesso Restrito</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            O cadastro de parceiros deve ser realizado através do link exclusivo da Usina contratante.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-brand">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-navy mb-3 tracking-tight">Cadastro Concluído!</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Sua empresa foi cadastrada no sistema <strong>{tenant.name}</strong>. Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

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
            className={`h-8 object-contain mb-16 ${!tenant?.logo_url && 'brightness-0 invert'}`} 
          />
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
            Portal do <br/><span className="text-primary font-serif italic font-medium">Fornecedor</span>
          </h1>
          <p className="text-slate-300 mt-6 text-lg max-w-sm leading-relaxed">
            Realize seu credenciamento para gerenciar operações na <strong>{tenant?.name || 'Usina'}</strong> de forma ágil e segura.
          </p>
        </div>

        <div className="relative z-10 pt-10 border-t border-white/10">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Plataforma de Segurança Multilocatária</p>
        </div>
      </div>

      {/* Área do Formulário */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-20 overflow-y-auto bg-slate-50/30">
        <div className="max-w-xl w-full mx-auto">
          
          <div className="mb-10 lg:hidden text-center">
            <img 
              src={tenant?.logo_url || "https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png"} 
              alt={tenant?.name || "Lins"} 
              className="h-8 object-contain mx-auto mb-6" 
            />
            <h2 className="text-3xl font-black text-navy tracking-tight">Credenciamento</h2>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-black text-navy tracking-tight mb-2">Cadastre-se</h2>
            <p className="text-slate-500 text-sm">Insira as informações da sua empresa para criar sua conta corporativa.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <InputGroup 
                label="Razão Social da Empresa" 
                value={formData.fullName} 
                onChange={v => setFormData({...formData, fullName: v})} 
                placeholder="Ex: Transportadora Silva LTDA" 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputGroup 
                  label="CNPJ Regional" 
                  value={formData.cnpj} 
                  onChange={handleCnpjChange} 
                  placeholder="00.000.000/0000-00" 
                />
                <InputGroup 
                  label="Telefone de Contato" 
                  value={formData.phone} 
                  onChange={handlePhoneChange} 
                  placeholder="(11) 90000-0000" 
                />
              </div>

              <InputGroup 
                label="Nome do Representante" 
                value={formData.representativeName} 
                onChange={v => setFormData({...formData, representativeName: v})} 
                placeholder="Ex: Carlos Mendes" 
              />
              
              <InputGroup 
                label="E-mail Corporativo" 
                type="email" 
                value={formData.email} 
                onChange={v => setFormData({...formData, email: v})} 
                placeholder="carlos@transportadora.com.br" 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputGroup 
                  label="Senha de Acesso" 
                  type="password" 
                  value={formData.password} 
                  onChange={v => setFormData({...formData, password: v})} 
                  placeholder="••••••••" 
                />
                <InputGroup 
                  label="Confirmar Senha" 
                  type="password" 
                  value={formData.confirmPassword} 
                  onChange={v => setFormData({...formData, confirmPassword: v})} 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-8 bg-primary hover:bg-[#008f8a] text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(0,181,173,0.5)] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Finalizar Cadastro
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-slate-500 pt-6">
              Já possui acesso? <Link to={`/${tenant?.subdomain || 'unknown'}/login`} className="text-primary font-bold hover:underline transition-all">Fazer login</Link>
            </p>
          </form>
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
}

function InputGroup({ label, placeholder, type = "text", value, onChange }: InputProps) {
  return (
    <div className="space-y-2 w-full">
      <label className="text-xs font-semibold text-slate-600 block pl-1">{label}</label>
      <input 
        type={type}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl text-navy placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm shadow-sm"
      />
    </div>
  );
}
