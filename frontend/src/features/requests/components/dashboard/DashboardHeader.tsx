import React from 'react';

interface DashboardHeaderProps {
  section: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ section }) => {
  return (
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/50 px-10 flex items-center justify-between sticky top-0 z-40">
      <div className="flex flex-col">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
          {section === 'approvals' || section === 'monitoring' || section === 'map' ? 'Monitoramento Integrado' : 
           section === 'team' ? 'Gestão Administrativa' : 'Inteligência Industrial'}
        </h2>
        <h3 className="text-sm font-bold text-navy uppercase tracking-tighter">
          {section === 'audit' ? 'Auditoria & Rastreabilidade' : 'Centro de Operações Unificado'}
        </h3>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] font-bold text-navy uppercase tracking-widest">Sistema Operacional</span>
      </div>
    </header>
  );
};

