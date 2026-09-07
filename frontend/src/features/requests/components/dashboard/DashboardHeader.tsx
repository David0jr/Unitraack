import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';

interface DashboardHeaderProps {
  section: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ section }) => {
  const { signOut } = useAuth();

  return (
    <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-10 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex flex-col">
        <h2 className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">
          {section === 'approvals' || section === 'monitoring' || section === 'map' ? 'Monitoramento Integrado' : 
           section === 'team' ? 'Gestão Administrativa' : 'Inteligência Industrial'}
        </h2>
        <h3 className="text-xs md:text-sm font-black text-navy uppercase tracking-tighter">
          {section === 'audit' || section === 'movements' ? 'Auditoria & Rastreabilidade' : 'Centro de Operações Unificado'}
        </h3>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={signOut}
          className="flex items-center justify-center h-8 w-8 bg-rose-50 text-rose-500 rounded-full border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm group"
          title="Sair da conta"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </header>
  );
};

