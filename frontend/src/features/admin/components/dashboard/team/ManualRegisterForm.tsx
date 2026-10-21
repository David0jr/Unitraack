import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Loader2, 
  Hash,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { useDashboard } from '../../../../../contexts/DashboardContext';
import { useAuth } from '../../../../../contexts/AuthContext';
import { CustomSelect } from './TeamCommon';

interface ManualRegisterFormProps {
  tenantId: string;
  usinaCnpj: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ManualRegisterForm({ tenantId, usinaCnpj, onSuccess, onError }: ManualRegisterFormProps) {
  const { sectors } = useDashboard();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    registrationNumber: '',
    role: 'LIDER_SETOR',
    sector: '',
    sector_id: ''
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const resp = await axios.get(`${import.meta.env.VITE_API_URL}/gestor/team`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.data.success) {
          setMembers(resp.data.data);
        }
      } catch (err) {
        console.error('Erro ao buscar equipe', err);
      }
    };
    fetchMembers();
  }, [token]);

  const occupiedSectorIds = members
    .filter(m => m.role === 'LIDER_SETOR' && m.sector_id)
    .map(m => m.sector_id);

  const sectorOptions = sectors.filter((s: any) => !s.parent_id).map((parent: any) => {
    const isParentOccupied = occupiedSectorIds.includes(parent.id);
    const availableSubSectors = sectors.filter((s: any) => s.parent_id === parent.id && !occupiedSectorIds.includes(s.id));
    
    if (availableSubSectors.length === 0) {
      if (isParentOccupied) return null;
      return {
        type: 'option',
        value: parent.id,
        label: parent.name
      };
    }

    const items = [];
    if (!isParentOccupied) {
      items.push({ value: parent.id, label: `Geral - ${parent.name}` });
    }
    
    items.push(...availableSubSectors.map((sub: any) => ({
      value: sub.id,
      label: sub.name
    })));

    if (items.length === 0) return null;

    return {
      type: 'group',
      label: parent.name,
      items
    };
  }).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.role === 'LIDER_SETOR' && !formData.sector_id) {
      onError('Por favor, selecione um setor para o Líder de Setor.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      onError('As senhas não coincidem!');
      return;
    }

    if (formData.password.length < 6) {
      onError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, { 
        ...formData, 
        usinaCnpj,
        tenantId
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      onSuccess('Colaborador cadastrado com sucesso!');
      setFormData({ 
        email: '', 
        password: '', 
        confirmPassword: '', 
        fullName: '', 
        registrationNumber: '', 
        role: 'LIDER_SETOR', 
        sector: '', 
        sector_id: '' 
      });
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro no cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h3 className="font-semibold text-navy text-base">Novo Colaborador Interno</h3>
        <p className="text-xs text-slate-500 font-normal">
          Cadastre diretamente novos membros da equipe da Usina Lins com credenciais imediatas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Nome Completo */}
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-medium text-slate-700 ml-0.5 block">Nome Completo</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <User className="w-4 h-4" />
            </div>
            <input 
              required
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              placeholder="Ex: João da Silva"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-xs"
            />
          </div>
        </div>

        {/* Matrícula */}
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-medium text-slate-700 ml-0.5 block">Número de Matrícula</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Hash className="w-4 h-4" />
            </div>
            <input 
              required
              value={formData.registrationNumber} 
              onChange={e => setFormData({...formData, registrationNumber: e.target.value})} 
              placeholder="Ex: 123456"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-xs"
            />
          </div>
        </div>

        {/* E-mail */}
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-medium text-slate-700 ml-0.5 block">E-mail Corporativo</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="w-4 h-4" />
            </div>
            <input 
              type="email"
              required
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="colaborador@usinalins.com.br"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-xs"
            />
          </div>
        </div>

        {/* Função / Cargo */}
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-medium text-slate-700 ml-0.5 block">Função / Cargo</label>
          <CustomSelect
            value={formData.role}
            onChange={(val: string) => setFormData({...formData, role: val})}
            placeholder="Selecione o cargo"
            options={[
              { type: 'option', value: 'LIDER_SETOR', label: 'Líder de Setor' },
              { type: 'option', value: 'PORTARIA', label: 'Controle de Acesso' }
            ]}
          />
        </div>

        {/* Senha Inicial */}
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-medium text-slate-700 ml-0.5 block">Senha Inicial</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
            <input 
              type={showPassword ? "text" : "password"}
              required
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-medium text-slate-700 ml-0.5 block">Confirmar Senha</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="w-4 h-4" />
            </div>
            <input 
              type={showConfirmPassword ? "text" : "password"}
              required
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              placeholder="Repita a senha"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Setor / Subsetor Responsável (se Líder) */}
        {formData.role === 'LIDER_SETOR' && (
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-slate-700 ml-0.5 block">Setor / Subsetor Responsável</label>
            <CustomSelect
              value={formData.sector_id}
              onChange={(val: string) => {
                const selected = sectors.find((s: any) => s.id === val);
                setFormData({...formData, sector_id: val, sector: selected?.name || ''});
              }}
              placeholder="Selecione o local específico..."
              options={[
                { type: 'option', value: '', label: 'Selecione o local específico...' },
                ...sectorOptions
              ]}
              direction="up"
            />
            {sectors.length === 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Cadastre setores na aba "Setores" antes de designar um líder.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="pt-2">
        <button 
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-navy hover:bg-[#002880] text-white rounded-xl font-medium text-xs shadow-md shadow-navy/15 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cadastrando...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Finalizar Cadastro</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
