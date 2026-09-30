import React from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

interface DashboardHeaderProps {
  section: string;
}

const SECTION_TITLES: Record<string, string> = {
  'approvals': 'Início / Painel',
  'team': 'Minha Equipe',
  'team-register': 'Minha Equipe · Registro Manual',
  'team-invite': 'Minha Equipe · Link de Convite',
  'team-members': 'Minha Equipe · Membros da Equipe',
  'team-sectors': 'Minha Equipe · Setores',
  'monitoring': 'Monitoramento de Setores',
  'map': 'Mapa Industrial',
  'audit': 'Auditoria & Rastro',
  'reports': 'Relatórios',
  'my-sector': 'Meu Setor',
  'movements': 'Movimentações'
};

const ROLE_MAP: Record<string, string> = {
  'GESTOR_SEGURANCA': 'Gestor de Segurança',
  'GESTOR': 'Gestor de Segurança',
  'LIDER_SETOR': 'Líder de Setor',
  'PORTARIA': 'Controle de Acesso',
  'SUPER_ADMIN': 'Administrador Geral',
  'TERCEIRIZADA': 'Terceirizada'
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ section }) => {
  const { profile } = useAuth();
  const title = SECTION_TITLES[section] || 'Painel de Controle';

  const userInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';
  const roleDisplay = profile?.role ? (ROLE_MAP[profile.role] || profile.role) : 'Usuário';

  const getUserSubtitle = () => {
    if (!profile) return 'Usuário';
    if (profile.role === 'LIDER_SETOR') {
      return profile.sector ? `Líder · ${profile.sector}` : 'Líder de Setor';
    }
    if (profile.role === 'GESTOR' || profile.role === 'GESTOR_SEGURANCA') {
      return 'Gestor de Segurança';
    }
    if (profile.role === 'PORTARIA') {
      return 'Controle de Acesso';
    }
    if (profile.role === 'SUPER_ADMIN') {
      return 'Administrador Geral';
    }
    if (profile.role === 'TERCEIRIZADA') {
      return 'Terceirizada';
    }
    return profile.sector || roleDisplay;
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-6 md:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-navy tracking-tight">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationDropdown />
        
        {/* Barrinha divisora */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Perfil do Usuário no canto superior direito */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {userInitial}
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-semibold text-navy truncate max-w-[160px]">
              {profile?.full_name || 'Usuário'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]">
              {getUserSubtitle()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
