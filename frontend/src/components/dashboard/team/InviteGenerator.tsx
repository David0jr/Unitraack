import { useState } from 'react';
import { 
  Copy, 
  Check, 
} from 'lucide-react';
import { useDashboard } from '../../../contexts/DashboardContext';
import { useTenant } from '../../../contexts/TenantContext';
import { CustomSelect } from './TeamCommon';

interface InviteGeneratorProps {
  usinaCnpj: string;
}

export function InviteGenerator({ usinaCnpj }: InviteGeneratorProps) {
  const { sectors } = useDashboard();
  const { tenant } = useTenant();
  const [copying, setCopying] = useState(false);
  const [inviteConfig, setInviteConfig] = useState({
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

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      role: inviteConfig.role,
      sector: inviteConfig.sector,
      sector_id: inviteConfig.sector_id,
      cnpj: usinaCnpj
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
    navigator.clipboard.writeText(generateInviteLink());
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-1">
        <h4 className="font-black text-navy text-sm uppercase italic">Gerador de Acessos Autorizados</h4>
        <p className="text-xs text-slate-400 font-medium">Gere links pré-configurados para que seus colaboradores se cadastrem com segurança.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Função Permitida</label>
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
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lugar de Atuação</label>
            <CustomSelect
              value={inviteConfig.sector_id}
              onChange={(val: string) => {
                const selected = sectors.find((s: any) => s.id === val);
                setInviteConfig({...inviteConfig, sector_id: val, sector: selected?.name || ''})
              }}
              placeholder="Qualquer Local"
              options={[
                { type: 'option', value: '', label: 'Qualquer Local' },
                ...sectorOptions
              ]}
              direction="up"
            />
          </div>
        )}
      </div>

      <div className="p-6 bg-[#0032A0] rounded-3xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16"></div>
        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4">Link de Confiança Lins</p>
        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 break-all">
          <code className="text-[10px] flex-1 font-mono leading-relaxed truncate">{generateInviteLink()}</code>
          <button 
            onClick={copyLink}
            className={`p-3 rounded-xl transition-all ${copying ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
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
