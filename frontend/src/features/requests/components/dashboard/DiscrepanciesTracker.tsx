import React, { useState, useMemo } from 'react';
import { AlertTriangle, Package, XCircle, Clock, Truck, Building2, AlertCircle } from 'lucide-react';
import { useDashboard } from '../../../../contexts/DashboardContext';

function formatSectorName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
    .join(' ');
}

export const DiscrepanciesTracker: React.FC = () => {
  const { requests, loading } = useDashboard();
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  // Filtra as requisições que possuem divergência registrada
  const discrepancies = useMemo(() => {
    if (!Array.isArray(requests)) return [];

    return requests.filter((req: any) => {
      const isDiscrepancy = 
        req.status === 'DISCREPANCY' || 
        (req.rejection_reason && !['REJECTED', 'REJECTED_LIDER', 'REJECTED_GESTOR', 'CANCELED'].includes(req.status));
      return isDiscrepancy;
    });
  }, [requests]);

  // Se não houver divergências, exibe estado limpo discreto
  if (!loading && discrepancies.length === 0) {
    return null;
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'DISCREPANCY':
      case 'ARRIVED':
      case 'IN_ANALYSIS':
        return { label: 'Na Portaria', color: 'bg-rose-50 text-rose-700 border-rose-200/80' };
      case 'IN_PLANTA':
        return { label: 'Em Planta (Com Ressalva)', color: 'bg-amber-50 text-amber-700 border-amber-200/80' };
      case 'WAITING_EXIT':
      case 'EXIT_CONFERENCE':
        return { label: 'Aguardando Saída', color: 'bg-blue-50 text-blue-700 border-blue-200/80' };
      case 'COMPLETED':
        return { label: 'Saída Realizada', color: 'bg-slate-100 text-slate-600 border-slate-200/80' };
      default:
        return { label: status, color: 'bg-slate-50 text-slate-600 border-slate-200/80' };
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: 'N/A', time: 'N/A' };
    try {
      const isMissingTimezone = !dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/);
      const d = new Date(isMissingTimezone ? `${dateStr}Z` : dateStr);
      return {
        date: d.toLocaleDateString('pt-BR'),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: 'N/A', time: '--:--' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header limpo e sutil */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-navy text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Acompanhamento de Divergências</span>
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200/80 px-3 py-1 rounded-xl shadow-xs">
          {discrepancies.length} {discrepancies.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {discrepancies.map(req => {
        const statusInfo = getStatusDisplay(req.status);
        const timeInfo = formatDateTime(req.gate_checked_at || req.entry_date);
        const materials = req.materials || [];

        return (
          <div 
            key={req.id} 
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Coluna 1: Empresa e Transporte */}
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base overflow-hidden shadow-xs flex-shrink-0"
                    style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}
                  >
                    {req.profile?.logo_url ? (
                      <img src={req.profile.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      req.profile?.full_name ? req.profile.full_name[0] : 'E'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-navy text-sm truncate">
                      {req.profile?.full_name || 'Empresa Terceirizada'}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400 font-normal">
                        {req.profile?.cnpj || 'CNPJ não informado'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium mb-1">Veículo / Motorista</p>
                    <p className="font-medium text-navy text-xs truncate">
                      {req.plate ? <span className="font-mono">{req.plate}</span> : '---'}
                      {req.driver_name ? ` • ${req.driver_name}` : ''}
                    </p>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium mb-1">Setor / Horário</p>
                    <p className="font-medium text-navy text-xs truncate">
                      {formatSectorName(req.sector_info?.name || req.sector || 'Geral')} • {timeInfo.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Motivo e Equipamentos */}
              <div className="flex-1 w-full md:border-l md:border-slate-100 md:pl-6 space-y-3.5">
                {/* Motivo da Divergência */}
                <div className="bg-amber-50/60 border border-amber-200/70 p-3.5 rounded-xl">
                  <p className="text-[11px] font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Motivo da Divergência:</span>
                  </p>
                  <p className="text-xs font-medium text-amber-950 leading-relaxed">
                    {req.rejection_reason || 'Divergência registrada na conferência da portaria.'}
                  </p>
                </div>

                {/* Equipamentos sob rastreio */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2">
                    Equipamentos vinculados ({materials.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {materials.map((mat: any) => (
                      <button
                        key={mat.id}
                        onClick={() => setSelectedMaterial(mat)}
                        className="bg-slate-50/80 hover:bg-slate-100 border border-slate-200/70 px-3 py-1.5 rounded-lg text-left transition-all flex items-center gap-2 group cursor-pointer shadow-xs"
                      >
                        <Package className="w-3.5 h-3.5 text-primary opacity-70 group-hover:opacity-100" />
                        <span className="text-xs font-medium text-navy">{mat.name}</span>
                        {mat.serial_number && (
                          <span className="text-[10px] text-slate-400 font-mono">({mat.serial_number})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modal de Detalhe Individual do Material */}
      {selectedMaterial && (
        <div 
          onClick={() => setSelectedMaterial(null)} 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200/80 cursor-default"
          >
            <div className="bg-navy px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{selectedMaterial.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedMaterial(null)} 
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedMaterial.image_url && (
                <div className="h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                  <img src={selectedMaterial.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-xl">
                  <p className="text-[10px] font-medium text-slate-400 mb-1">Fabricante</p>
                  <p className="font-semibold text-navy text-xs truncate">{selectedMaterial.brand || '---'}</p>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-xl">
                  <p className="text-[10px] font-medium text-slate-400 mb-1">Modelo</p>
                  <p className="font-semibold text-navy text-xs truncate">{selectedMaterial.model || '---'}</p>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-xl">
                  <p className="text-[10px] font-medium text-slate-400 mb-1">Nº Série</p>
                  <p className="font-semibold text-navy text-xs font-mono truncate">{selectedMaterial.serial_number || '---'}</p>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Condição do Item</span>
                <span className="font-semibold text-navy">{selectedMaterial.condition || 'Usado'}</span>
              </div>

              <button 
                onClick={() => setSelectedMaterial(null)} 
                className="w-full py-2.5 bg-navy hover:bg-[#002880] text-white font-medium text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
