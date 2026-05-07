import { useState } from 'react';
import axios from 'axios';
import { 
  Loader2, 
} from 'lucide-react';
import { useDashboard } from '../../../../../contexts/DashboardContext';
import { useAuth } from '../../../../../contexts/AuthContext';
import { CustomSelect } from './TeamCommon';

interface ManualRegisterFormProps {
  usinaCnpj: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ManualRegisterForm({ usinaCnpj, onSuccess, onError }: ManualRegisterFormProps) {
  const { sectors } = useDashboard();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'LIDER_SETOR',
    sector: '',
    sector_id: ''
  });

  const sectorOptions = sectors.filter((s: any) => !s.parent_id).map((parent: any) => ({
    type: 'group',
    label: parent.name,
    items: sectors.filter((s: any) => s.parent_id === parent.id).map((sub: any) => ({
      value: sub.id,
      label: sub.name
    }))
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, { 
        ...formData, 
        usinaCnpj 
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      onSuccess('Membro cadastrado com sucesso!');
      setFormData({ email: '', password: '', fullName: '', role: 'LIDER_SETOR', sector: '', sector_id: '' });
    } catch (err: any) {
      onError(err.response?.data?.error || 'Erro no cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="space-y-1">
        <h4 className="font-bold text-navy text-sm uppercase">Novo Colaborador Interno</h4>
        <p className="text-xs text-slate-400 font-medium">Cadastre diretamente membros da sua equipe UsinaLins.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Nome Completo</label>
          <input 
            required
            value={formData.fullName} 
            onChange={e => setFormData({...formData, fullName: e.target.value})} 
            placeholder="Ex: João Silva"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-navy placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-xs"
          />
        </div>
        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">E-mail Usina</label>
          <input 
            type="email"
            required
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            placeholder="email@usinalins.com.br"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-navy placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-xs"
          />
        </div>
        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Senha Inicial</label>
          <input 
            type="password"
            required
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            placeholder="••••••••"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-navy placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Função / Cargo</label>
          <CustomSelect
            value={formData.role}
            onChange={(val: string) => setFormData({...formData, role: val})}
            placeholder="Selecione a função"
            options={[
              { type: 'option', value: 'LIDER_SETOR', label: 'Líder de Setor' },
              { type: 'option', value: 'PORTARIA', label: 'Segurança da Portaria' }
            ]}
          />
        </div>
      </div>

      {formData.role === 'LIDER_SETOR' && (
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Setor / Subsetor Responsável</label>
          <CustomSelect
            value={formData.sector_id}
            onChange={(val: string) => {
              const selected = sectors.find((s: any) => s.id === val);
              setFormData({...formData, sector_id: val, sector: selected?.name || ''})
            }}
            placeholder="Selecione o local específico..."
            options={[
              { type: 'option', value: '', label: 'Selecione o local específico...' },
              ...sectorOptions
            ]}
            direction="up"
          />
          {sectors.length === 0 && (
            <p className="text-[9px] text-amber-500 font-bold uppercase mt-1 ml-1 lowercase italic">! Cadastre setores na aba "Setores" primeiro</p>
          )}
        </div>
      )}

      <button 
        type="submit"
        disabled={loading}
        className="px-10 py-4 bg-navy text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-navy/20 hover:bg-[#002880] transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Finalizar Cadastro'}
      </button>
    </form>
  );
}

