import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  LayoutDashboard, 
  MapPin, 
  Map as MapIcon, 
  BarChart3, 
  PieChart, 
  LogOut, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Building,
  UserPlus,
  Link as LinkIcon,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useDashboard } from '../../../../contexts/DashboardContext';
import { useTenant } from '../../../../contexts/TenantContext';

const ROLE_MAP: Record<string, string> = {
  'GESTOR_SEGURANCA': 'Gestor de Segurança',
  'LIDER_SETOR': 'Líder de Setor',
  'PORTARIA': 'Controle de Acesso',
  'SUPER_ADMIN': 'Administrador Geral'
};

function formatSectorName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ');
}

interface DashboardSidebarProps {
  activeSection: string;
  setActiveSection: (section: string, parentId?: string | null) => void;
  selectedParentId?: string | null;
  userName?: string;
  userRole?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  activeSection, 
  setActiveSection, 
  selectedParentId,
  userName, 
  userRole 
}) => {
  const { signOut, profile } = useAuth();
  const { tenant } = useTenant();
  const { sectors } = useDashboard();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [monitoringExpanded, setMonitoringExpanded] = useState(activeSection === 'monitoring');
  const [teamExpanded, setTeamExpanded] = useState(
    activeSection === 'team' || activeSection.startsWith('team-')
  );

  React.useEffect(() => {
    if (activeSection === 'team' || activeSection.startsWith('team-')) {
      setTeamExpanded(true);
    }
  }, [activeSection]);

  const parentSectors = sectors.filter(s => !s.parent_id);
  const isTeamActive = activeSection === 'team' || activeSection.startsWith('team-');

  return (
    <aside className={`hidden lg:flex ${isCollapsed ? 'w-20' : 'w-60'} bg-navy flex-col shrink-0 border-r border-white/10 shadow-2xl z-50 select-none relative transition-all duration-300 ease-in-out`}>
      {/* Botão de Recolher / Expandir Menu */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-5 w-7 h-7 bg-white border border-slate-200/80 rounded-full shadow-md flex items-center justify-center text-slate-600 hover:text-navy hover:scale-105 transition-all z-50 cursor-pointer"
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
      </button>

      {/* Topo / Logo */}
      <div className={`px-4 h-16 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} border-b border-white/10 shrink-0 overflow-hidden`}>
        {isCollapsed ? (
          <img 
            src="/logo-lins-symbol.png" 
            alt="Usina Lins" 
            className="w-8 h-8 object-contain shrink-0 animate-in fade-in zoom-in-95 duration-200"
          />
        ) : (
          <img 
            src={tenant?.logo_url || profile?.tenant?.logo_url || '/logo-lins-white.png'} 
            alt={tenant?.name || profile?.tenant?.name || 'Usina Lins'} 
            className="h-7 w-auto max-w-[150px] object-contain transition-all"
            onError={(e: any) => {
              e.currentTarget.src = '/logo-lins-white.png';
            }}
          />
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        <NavButton 
          active={activeSection === 'approvals'} 
          onClick={() => setActiveSection('approvals')}
          icon={<LayoutDashboard className="w-[18px] h-[18px] shrink-0" />}
          label="Início / Painel"
          isCollapsed={isCollapsed}
        />

        {/* Minha Equipe engavetada */}
        <div className="space-y-1">
          <NavButton 
            active={isTeamActive} 
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setTeamExpanded(true);
                if (!activeSection.startsWith('team')) {
                  setActiveSection('team-register');
                }
              } else {
                setTeamExpanded(!teamExpanded);
                if (!activeSection.startsWith('team')) {
                  setActiveSection('team-register');
                }
              }
            }}
            icon={<Users className="w-[18px] h-[18px] shrink-0" />}
            label="Minha Equipe"
            hasSubmenu
            expanded={teamExpanded}
            isCollapsed={isCollapsed}
          />

          {!isCollapsed && (
            <div className={`pl-4 space-y-1 overflow-hidden transition-all duration-300 ${teamExpanded ? 'max-h-64 opacity-100 pt-1' : 'max-h-0 opacity-0'}`}>
              <button
                onClick={() => setActiveSection('team-register')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeSection === 'team-register' || activeSection === 'team'
                    ? 'bg-primary/20 text-white font-semibold border border-primary/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span className="truncate">Registro Manual</span>
              </button>

              <button
                onClick={() => setActiveSection('team-invite')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeSection === 'team-invite'
                    ? 'bg-primary/20 text-white font-semibold border border-primary/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span className="truncate">Link de Convite</span>
              </button>

              <button
                onClick={() => setActiveSection('team-members')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeSection === 'team-members'
                    ? 'bg-primary/20 text-white font-semibold border border-primary/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span className="truncate">Membros da Equipe</span>
              </button>

              <button
                onClick={() => setActiveSection('team-sectors')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeSection === 'team-sectors'
                    ? 'bg-primary/20 text-white font-semibold border border-primary/30' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span className="truncate">Setores</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <NavButton 
            active={activeSection === 'monitoring'} 
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setMonitoringExpanded(true);
              } else {
                setMonitoringExpanded(!monitoringExpanded);
              }
            }}
            icon={<MapPin className="w-[18px] h-[18px] shrink-0" />}
            label="Monitoramento"
            hasSubmenu
            expanded={monitoringExpanded}
            isCollapsed={isCollapsed}
          />
          
          {!isCollapsed && (
            <div className={`pl-4 space-y-1 overflow-hidden transition-all duration-300 ${monitoringExpanded ? 'max-h-64 opacity-100 pt-1' : 'max-h-0 opacity-0'}`}>
              {parentSectors.map(parent => (
                <button
                  key={parent.id}
                  onClick={() => setActiveSection('monitoring', parent.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedParentId === parent.id 
                      ? 'bg-primary/20 text-white font-semibold border border-primary/30' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span className="truncate">{formatSectorName(parent.name)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <NavButton 
          active={activeSection === 'map'} 
          onClick={() => setActiveSection('map')}
          icon={<MapIcon className="w-[18px] h-[18px] shrink-0" />}
          label="Mapa Industrial"
          isCollapsed={isCollapsed}
        />
        <NavButton 
          active={activeSection === 'audit'} 
          onClick={() => setActiveSection('audit')}
          icon={<BarChart3 className="w-[18px] h-[18px] shrink-0" />}
          label="Auditoria & Rastro"
          isCollapsed={isCollapsed}
        />
        <NavButton 
          active={activeSection === 'reports'} 
          onClick={() => setActiveSection('reports')}
          icon={<PieChart className="w-[18px] h-[18px] shrink-0" />}
          label="Relatórios"
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* Rodapé: Encerramento de Sessão */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <button 
          onClick={signOut} 
          title={isCollapsed ? "Encerrar Sessão" : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3.5 py-2.5'} rounded-xl text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-medium`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Encerrar Sessão</span>}
        </button>
      </div>
    </aside>
  );
};

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  hasSubmenu, 
  expanded,
  isCollapsed 
}: { 
  active: boolean, 
  onClick: () => void, 
  icon: any, 
  label: string, 
  hasSubmenu?: boolean, 
  expanded?: boolean,
  isCollapsed?: boolean 
}) {
  return (
    <button 
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'} rounded-2xl text-xs font-medium transition-all ${
        active && (!hasSubmenu || isCollapsed)
          ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20' 
          : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className={`flex items-center ${isCollapsed ? '' : 'gap-3 min-w-0'}`}>
        {icon}
        {!isCollapsed && <span className="truncate">{label}</span>}
      </div>
      {!isCollapsed && hasSubmenu && (
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 opacity-60 ${expanded ? 'rotate-180 opacity-100 text-primary' : ''}`} />
      )}
    </button>
  );
}

