import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Package, 
  History, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';

const ROLE_MAP: Record<string, string> = {
  'GESTOR_SEGURANCA': 'Gestor de Segurança',
  'LIDER_SETOR': 'Líder de Setor',
  'PORTARIA': 'Agente de Portaria',
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
  const { signOut } = useAuth();

  return (
    <aside className="w-72 bg-navy flex flex-col shrink-0 border-r border-navy/10 shadow-xl z-50">
      <div className="p-8 h-24 flex items-center gap-4 border-b border-white/5">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
           <ShieldCheck className="w-6 h-6 text-primary shadow-xl" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold uppercase text-sm tracking-tighter leading-none">
            {sectorName ? `Setor ${sectorName}` : 'Lins Agro'}
          </span>
          <span className="text-[9px] text-primary font-bold uppercase tracking-widest mt-1">Líder Dashboard</span>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-3">
        <NavButton 
          active={activeSection === 'approvals'} 
          onClick={() => setActiveSection('approvals')}
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Aprovações"
        />
        <NavButton 
          active={activeSection === 'my-sector'} 
          onClick={() => setActiveSection('my-sector')}
          icon={<Package className="w-5 h-5" />}
          label="Meu Setor"
        />
        <NavButton 
          active={activeSection === 'movements'} 
          onClick={() => setActiveSection('movements')}
          icon={<History className="w-5 h-5" />}
          label="Movimentações"
        />
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-all cursor-default group/profile mb-2">
           <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-[10px] border border-primary/10 shrink-0">
             {userName ? userName[0] : 'L'}
           </div>
           <div className="flex flex-col overflow-hidden">
             <p className="text-white/80 font-bold text-[10px] uppercase truncate leading-tight group-hover/profile:text-white transition-colors">
               {userName || 'Líder'}
             </p>
             <p className="text-[8px] text-primary font-bold uppercase tracking-widest opacity-50 group-hover/profile:opacity-100 transition-opacity truncate">
               {userRole ? (ROLE_MAP[userRole] || userRole) : 'Líder de Setor'}
             </p>
           </div>
        </div>
        
        <button 
          onClick={signOut} 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Encerrar Sessão</span>
        </button>
      </div>
    </aside>
  );
};

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean, 
  onClick: () => void, 
  icon: any, 
  label: string 
}) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
        active 
          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
          : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon} {label}
    </button>
  );
}
