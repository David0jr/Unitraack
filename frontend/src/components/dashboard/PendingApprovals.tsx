import React from 'react';
import { Clock, Loader2, Check } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';

export const PendingApprovals: React.FC = () => {
  const { requests, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
        <p className="mt-4 text-slate-300 font-black text-[10px] uppercase tracking-widest">Sincronizando dados operativos...</p>
      </div>
    );
  }

  const authorizedRequests = requests.filter(req => req.status === 'APPROVED');

  if (authorizedRequests.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 flex flex-col items-center gap-4">
        <Check className="w-12 h-12 text-emerald-400 bg-emerald-50 p-3 rounded-full" />
        <div>
          <p className="text-navy font-black text-sm uppercase">Nenhuma entrada programada</p>
          <p className="text-slate-400 text-xs mt-1">Todas as liberações dos líderes já acessaram a planta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-navy text-xs uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Previsão de Entradas (Autorizadas pelos Líderes)
        </h3>
        <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">Controle de Portaria</span>
      </div>

      {authorizedRequests.map(req => (
        <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-primary/20 transition-all group">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Driver Info */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white font-black text-lg">
                  {req.profile?.full_name ? req.profile.full_name[0] : '?'}
                </div>
                <div>
                  <h4 className="font-black text-navy text-sm uppercase">{req.profile?.full_name || 'Usuário Desconhecido'}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Terceirizada</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Setor Destino</p>
                  <p className="font-bold text-navy text-xs">
                     {req.sector_info?.parent?.name ? (
                       <span className="opacity-40">{req.sector_info.parent.name} &gt; </span>
                     ) : null}
                     {req.sector_info?.name || req.sector}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Horário Previsto</p>
                  <p className="font-bold text-navy text-xs">{new Date(req.entry_date).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Materials Preview */}
            <div className="flex-1 w-full md:border-l md:border-slate-50 md:pl-6">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-3 px-1">Equipamentos Liberados ({req.materials.length})</p>
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {req.materials.map((mat: any) => (
                  <div key={mat.id} className="flex items-center justify-between bg-slate-50/50 p-2 rounded-xl text-[10px] font-bold text-navy">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                      <span className="truncate">{mat.name} - {mat.model || 'S/ Modelo'}</span>
                    </div>
                    <span className="text-[9px] bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100 flex-shrink-0">SN: {mat.serial_number || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
