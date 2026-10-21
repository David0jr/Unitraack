import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Copy, 
  Check, 
  ExternalLink,
  Link as LinkIcon,
  Shield,
  MapPin,
  Share2,
  AlertCircle
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
      return '';
    }

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      role: inviteConfig.role,
      sector: inviteConfig.sector,
      sector_id: inviteConfig.sector_id,
      cnpj: usinaCnpj,
      tenant_id: tenantId || ''
    });
    
    const cleanParams = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      if (value) cleanParams.append(key, value);
    }

    const path = tenant?.subdomain ? `/${tenant.subdomain}/registro-interno` : `/registro-interno`;
    return `${baseUrl}${path}?${cleanParams.toString()}`;
  };

  const inviteUrl = generateInviteLink();

  const copyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!inviteUrl) return;
    const text = encodeURIComponent(
      `Olá! Segue o link para seu cadastro oficial na Usina Lins:\n${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const roleLabel = inviteConfig.role === 'LIDER_SETOR' ? 'Líder de Setor' : 'Controle de Acesso';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h3 className="font-semibold text-navy text-base">Gerador de Links de Convite</h3>
        <p className="text-xs text-slate-500 font-normal">
          Crie links de convite pré-configurados e seguros para que os colaboradores façam seu autocadastro.
        </p>
      </div>

      {/* Parâmetros do Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 ml-0.5 block">Função Permitida</label>
          <CustomSelect
            value={inviteConfig.role}
            onChange={(val: string) => setInviteConfig({...inviteConfig, role: val})}
            placeholder="Selecione a função"
            options={[
              { type: 'option', value: 'LIDER_SETOR', label: 'Líder de Setor' },
              { type: 'option', value: 'PORTARIA', label: 'Controle de Acesso' }
            ]}
          />
        </div>
        
        {inviteConfig.role === 'LIDER_SETOR' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 ml-0.5 block">Setor de Atuação</label>
            <CustomSelect
              value={inviteConfig.sector_id}
              onChange={(val: string) => {
                const selected = sectors.find((s: any) => s.id === val);
                setInviteConfig({...inviteConfig, sector_id: val, sector: selected?.name || ''});
              }}
              placeholder="Selecione o setor..."
              options={[
                { type: 'option', value: '', label: 'Selecione o setor...' },
                ...sectorOptions
              ]}
              direction="down"
            />
          </div>
        )}
      </div>

      {/* Caixa do Link Gerado */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-navy">Link Seguro Usina Lins</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 flex items-center gap-1.5 shadow-xs">
              <Shield className="w-3 h-3 text-primary" />
              {roleLabel}
            </span>
            {inviteConfig.sector && (
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 flex items-center gap-1.5 shadow-xs">
                <MapPin className="w-3 h-3 text-amber-500" />
                {inviteConfig.sector}
              </span>
            )}
          </div>
        </div>

        {isPendingSectorSelection ? (
          <div className="py-6 px-4 text-center bg-amber-50/60 border border-dashed border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-amber-800">Selecione o setor acima para gerar o link de convite.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="p-2 text-slate-400 shrink-0">
                <LinkIcon className="w-4 h-4 text-primary" />
              </div>
              <input 
                type="text" 
                readOnly 
                value={inviteUrl}
                className="w-full bg-transparent text-xs text-slate-700 font-mono focus:outline-none select-all truncate"
              />
              <button 
                onClick={copyLink}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copying 
                    ? 'bg-emerald-500 text-white shadow-xs' 
                    : 'bg-primary hover:bg-[#00928a] text-white shadow-xs'
                }`}
              >
                {copying ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={shareWhatsApp}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:text-emerald-600 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Enviar pelo WhatsApp</span>
              </button>

              <a
                href={inviteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:text-navy transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Testar Link</span>
              </a>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed font-normal pt-1">
          * Os colaboradores que acessarem este link terão a função e o setor preenchidos e travados para evitar inconsistências no sistema de monitoramento.
        </p>
      </div>
    </div>
  );
}
