import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Package, 
  History, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTenant } from '../../../../contexts/TenantContext';

const ROLE_MAP: Record<string, string> = {
  'GESTOR_SEGURANCA': 'Gestor de Segurança',
  'LIDER_SETOR': 'Líder de Setor',
  'PORTARIA': 'Controle de Acesso',
  'SUPER_ADMIN': 'Administrador Geral'
};

interface LiderSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  userName?: string;
  userRole?: string;
  sectorName?: string;
}

export const LiderSidebar: React.FC<LiderSidebarProps> = ({ 
  activeSection, 
  setActiveSection, 
  userName, 
  userRole,
  sectorName
}) => {
  const { signOut, profile } = useAuth();
  const { tenant } = useTenant();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        <NavButton 
          active={activeSection === 'approvals'} 
          onClick={() => setActiveSection('approvals')}
          icon={<LayoutDashboard className="w-[18px] h-[18px] shrink-0" />}
          label="Aprovações"
          isCollapsed={isCollapsed}
        />
        <NavButton 
          active={activeSection === 'my-sector'} 
          onClick={() => setActiveSection('my-sector')}
          icon={<Package className="w-[18px] h-[18px] shrink-0" />}
          label="Meu Setor"
          isCollapsed={isCollapsed}
        />
        <NavButton 
          active={activeSection === 'movements'} 
          onClick={() => setActiveSection('movements')}
          icon={<History className="w-[18px] h-[18px] shrink-0" />}
          label="Movimentações"
          isCollapsed={isCollapsed}
        />
      </nav>

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
  isCollapsed 
}: { 
  active: boolean, 
  onClick: () => void, 
  icon: any, 
  label: string,
  isCollapsed?: boolean 
}) {
  return (
    <button 
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'} rounded-2xl text-xs font-medium transition-all ${
        active 
          ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20' 
          : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
