import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  LayoutDashboard, 
  MapPin, 
  Map as MapIcon, 
  BarChart3, 
  LogOut,
  ChevronDown,
  Building
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useDashboard } from '../../../../contexts/DashboardContext';

const ROLE_MAP: Record<string, string> = {
  'GESTOR_SEGURANCA': 'Gestor de Segurança',
  'LIDER_SETOR': 'Líder de Setor',
  'PORTARIA': 'Agente de Portaria',
  'SUPER_ADMIN': 'Administrador Geral'
};

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
  const { signOut } = useAuth();
  const { sectors } = useDashboard();
  const [monitoringExpanded, setMonitoringExpanded] = React.useState(activeSection === 'monitoring');

  const parentSectors = sectors.filter(s => !s.parent_id);

  return (
    <aside className="w-72 bg-navy flex flex-col shrink-0 border-r border-navy/10 shadow-2xl z-50">
      <div className="p-8 h-24 flex items-center gap-4 border-b border-white/5">
        <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
           <ShieldCheck className="w-6 h-6 text-primary shadow-xl" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-black uppercase text-sm tracking-tighter leading-none">Lins Agro</span>
          <span className="text-[9px] text-primary font-bold uppercase tracking-widest mt-1">Security Dashboard</span>
        </div>
      </div>

      <nav className="flex-1 p-6 pr-2 space-y-3 overflow-y-auto">
        <NavButton 
          active={activeSection === 'approvals'} 
          onClick={() => setActiveSection('approvals')}
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Início / Painel"
        />
        <NavButton 
          active={activeSection === 'team'} 
          onClick={() => setActiveSection('team')}
          icon={<Users className="w-5 h-5" />}
          label="Minha Equipe"
        />
        
        <div className="space-y-1">
          <NavButton 
            active={activeSection === 'monitoring'} 
            onClick={() => setMonitoringExpanded(!monitoringExpanded)}
            icon={<MapPin className="w-5 h-5" />}
            label="Monitoramento"
            hasSubmenu
            expanded={monitoringExpanded}
          />
          
          <div className={`pl-6 space-y-1 overflow-hidden transition-all duration-300 ${monitoringExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
            {parentSectors.map(parent => (
              <button
                key={parent.id}
                onClick={() => setActiveSection('monitoring', parent.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  selectedParentId === parent.id 
                    ? 'bg-primary/20 text-primary border border-primary/20' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                {parent.name}
              </button>
            ))}
          </div>
        </div>

        <NavButton 
          active={activeSection === 'map'} 
          onClick={() => setActiveSection('map')}
          icon={<MapIcon className="w-5 h-5" />}
          label="Mapa Industrial"
        />
        <NavButton 
          active={activeSection === 'audit'} 
          onClick={() => setActiveSection('audit')}
          icon={<BarChart3 className="w-5 h-5" />}
          label="Auditoria & Rastro"
        />
      </nav>

      <div className="p-6 border-t border-white/5 space-y-4">
        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xs border border-primary/10">
               {userName ? userName[0] : 'G'}
             </div>
             <div className="flex flex-col overflow-hidden">
               <p className="text-white font-black text-xs uppercase truncate leading-none mb-1">
                 {userName || 'Gestor'}
               </p>
               <p className="text-[9px] text-primary font-bold uppercase tracking-widest opacity-70">
                 {userRole ? (ROLE_MAP[userRole] || userRole) : 'Gestor de Segurança'}
               </p>
             </div>
          </div>
        </div>
        
        <button 
          onClick={signOut} 
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-widest">Encerrar Sessão</span>
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
  expanded 
}: { 
  active: boolean, 
  onClick: () => void, 
  icon: any, 
  label: string, 
  hasSubmenu?: boolean, 
  expanded?: boolean 
}) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active && !hasSubmenu
          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
          : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-4">
        {icon} {label}
      </div>
      {hasSubmenu && (
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180 text-primary' : ''}`} />
      )}
    </button>
  );
}

