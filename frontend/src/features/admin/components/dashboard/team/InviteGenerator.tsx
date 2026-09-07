import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Copy, 
  Check, 
} from 'lucide-react';
import { useDashboard } from '../../../../../contexts/DashboardContext';
import { useTenant } from '../../../../../contexts/TenantContext';
import { useAuth } from '../../../../../contexts/AuthContext';
import { CustomSelect } from './TeamCommon';

interface InviteGeneratorProps {
  tenantId?: string;
  usinaCnpj: string;
}

export function InviteGenerator({ tenantId, usinaCnpj }: InviteGeneratorProps) {
  const { sectors } = useDashboard();
  const { tenant } = useTenant();
  const { token } = useAuth();
  const [copying, setCopying] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteConfig, setInviteConfig] = useState({
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

  const isPendingSectorSelection = inviteConfig.role === 'LIDER_SETOR' && !inviteConfig.sector_id;

  const generateInviteLink = () => {
    if (isPendingSectorSelection) {
      return 'Selecione um setor para gerar o link...';
    }

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      role: inviteConfig.role,
      sector: inviteConfig.sector,
      sector_id: inviteConfig.sector_id,
      cnpj: usinaCnpj,
      tenant_id: tenantId || ''
    });
    
    // Remove parâmetros vazios para manter a URL mais amigável
    const cleanParams = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      if (value) cleanParams.append(key, value);
    }

    const path = tenant?.subdomain ? `/${tenant.subdomain}/registro-interno` : `/registro-interno`;
    return `${baseUrl}${path}?${cleanParams.toString()}`;
  };

  const copyLink = () => {
    if (isPendingSectorSelection) return;
    navigator.clipboard.writeText(generateInviteLink());
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-1">
        <h4 className="font-bold text-navy text-sm uppercase italic">Gerador de Acessos Autorizados</h4>
        <p className="text-xs text-slate-400 font-medium">Gere links pré-configurados para que seus colaboradores se cadastrem com segurança.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Função Permitida</label>
          <CustomSelect
            value={inviteConfig.role}
            onChange={(val: string) => setInviteConfig({...inviteConfig, role: val})}
            placeholder="Selecione a função"
            options={[
              { type: 'option', value: 'LIDER_SETOR', label: 'Líder de Setor' },
              { type: 'option', value: 'PORTARIA', label: 'Segurança da Portaria' }
            ]}
          />
        </div>
        
        {inviteConfig.role === 'LIDER_SETOR' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lugar de Atuação</label>
            <CustomSelect
              value={inviteConfig.sector_id}
              onChange={(val: string) => {
                const selected = sectors.find((s: any) => s.id === val);
                setInviteConfig({...inviteConfig, sector_id: val, sector: selected?.name || ''})
              }}
              placeholder="Selecione o setor..."
              options={[
                { type: 'option', value: '', label: 'Selecione o setor...' },
                ...sectorOptions
              ]}
              direction="up"
            />
          </div>
        )}
      </div>

      <div className="p-6 bg-[#0032A0] rounded-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16"></div>
        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-4">Link de Confiança Lins</p>
        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10 break-all">
          <code className="text-[10px] flex-1 font-mono leading-relaxed truncate">{generateInviteLink()}</code>
          <button 
            onClick={copyLink}
            disabled={inviteConfig.role === 'LIDER_SETOR' && !inviteConfig.sector_id}
            className={`p-3 rounded-xl transition-all ${copying ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[9px] text-blue-200/50 mt-4 leading-relaxed uppercase font-bold tracking-widest">
           Nota: Este link preencherá e travará o cargo e setor para o usuário.
        </p>
      </div>
    </div>
  );
}

