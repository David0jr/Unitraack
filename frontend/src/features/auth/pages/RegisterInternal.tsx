import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ShieldCheck, Loader2, CheckCircle2, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { maskCNPJ, validateEmail } from '../../../utils/masks';
import { useTenant } from '../../../contexts/TenantContext';

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
    sector: '',
    sector_id: '',
    usinaCnpj: '',
    usinaName: ''
  });

  useEffect(() => {
    const roleParam = searchParams.get('role') as Role;
    const sectorParam = searchParams.get('sector');
    const cnpjParam = searchParams.get('cnpj');

    // Segurança: Permite o acesso caso a função (role) esteja definida na URL.
    // O CNPJ será obtido preferencialmente do contexto da usina já carregado.
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-brand">
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
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
        <div className="min-h-screen flex items-center justify-center">
           <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-brand antialiased">
      <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-2 bg-white overflow-hidden text-navy">
        
        {/* Banner Lateral */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-[#0032A0] text-white relative">
          <div className="absolute top-12 left-12">
             <img 
               src={tenant?.logo_url || "https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png"} 
               alt={tenant?.name || "Lins"} 
               className={`h-10 object-contain ${!tenant?.logo_url && 'brightness-[200%]'}`} 
             />
          </div>

          <ShieldCheck className="w-16 h-16 mb-8 text-[#00B5AD]" />
          <h1 className="text-4xl font-bold mb-6 leading-tight uppercase tracking-tighter">Portal do Colaborador <br/><span className="text-primary italic">{tenant?.name || 'Lins Agro'}</span></h1>

          <p className="text-blue-100/60 text-lg font-medium leading-relaxed">
            Finalize o cadastro da sua conta administrativa vinculada à planta via convite oficial.
          </p>
        </div>

        {/* Formulário */}
        <div className="p-8 md:p-20 overflow-y-auto flex flex-col justify-center bg-[#F8FAFC]">
          <form onSubmit={handleRegister} className="max-w-md w-full mx-auto space-y-6">
            <div className="flex flex-col gap-1 mb-6">
              <span className="text-[10px] font-bold text-[#00B5AD] uppercase tracking-widest italic">DADOS DO CONVITE</span>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-navy uppercase tracking-tighter">{role?.replace('_', ' ')}</h2>
                <Lock className="w-4 h-4 text-slate-300" />
              </div>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold">{error}</div>}

            <div className="grid gap-4">
              <InputGroup label="Seu Nome Completo" value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} placeholder="Ex: Lucas Ferreira" />
              <InputGroup label="E-mail Usina" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="seu.nome@linsagro.com.br" />
              <InputGroup label="Senha de Acesso" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} placeholder="••••••••" />
              
              <div className="pt-4 border-t border-slate-100 mt-2 space-y-4">
                <InputGroup 
                  label="CNPJ da Unidade" 
                  value={formData.usinaCnpj} 
                  onChange={() => {}} 
                  disabled={true}
                />
                {role === 'LIDER_SETOR' && (
                    <InputGroup 
                      label="Setor" 
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
              className="w-full py-5 bg-[#0032A0] hover:bg-[#002880] text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-navy/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin mx-auto text-white opacity-40" /> : (
                <>
                  Confirmar e Ativar Conta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">Este cadastro é monitorado pela segurança patrimonial.</p>
          </form>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, placeholder, type = "text", value, onChange, disabled = false }: { label: string, placeholder?: string, type?: string, value: string, onChange: (v: string) => void, disabled?: boolean }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
      <input 
        type={type}
        required
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-5 py-4 border rounded-xl text-navy placeholder-slate-300 focus:outline-none transition-all font-bold text-sm ${
          disabled 
            ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-white border-slate-100 focus:ring-4 focus:ring-[#00B5AD]/5 focus:border-[#00B5AD]'
        }`}
      />
    </div>
  );
}

