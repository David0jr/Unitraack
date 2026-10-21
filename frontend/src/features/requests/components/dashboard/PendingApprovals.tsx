import React, { useState } from 'react';
import { Clock, Loader2, Check, Package, XCircle, LogOut, X, Building2, User } from 'lucide-react';
import { useDashboard } from '../../../../contexts/DashboardContext';

function formatSectorName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
    .join(' ');
}

export const PendingApprovals: React.FC = () => {
  const { requests, loading } = useDashboard();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-3 text-slate-500 font-medium text-xs">Sincronizando dados operacionais...</p>
      </div>
    );
  }

  const authorizedRequests = requests.filter(req => req.status === 'APPROVED' || req.status === 'APPROVED_LIDER');

  if (authorizedRequests.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
          <Check className="w-6 h-6" />
        </div>
        <div>
          <p className="text-navy font-semibold text-sm">Nenhum aviso de entrada pendente</p>
          <p className="text-slate-400 text-xs mt-0.5">Não há materiais autorizados pelos líderes aguardando acesso no momento.</p>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: 'N/A', time: 'N/A' };
    
    try {
      const isMissingTimezone = !dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/);
      const d = new Date(isMissingTimezone ? `${dateStr}Z` : dateStr);
      return {
        date: d.toLocaleDateString('pt-BR'),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return { date: 'Data Inválida', time: '--:--' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-navy text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span>Avisos de Entrada (Autorizados pelos Líderes)</span>
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200/80 px-3 py-1 rounded-xl shadow-xs">
          Controle de Portaria
        </span>
      </div>

      {authorizedRequests.map(req => (
        <div key={req.id} className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all group">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Informações da Empresa / Transporte */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4">
                <button 
                  onClick={() => setSelectedCompany({
                    full_name: req.profile?.full_name,
                    representative_name: req.profile?.representative_name,
                    phone: req.profile?.phone,
                    cnpj: req.profile?.cnpj,
                    logo_url: req.profile?.logo_url,
                    theme_color: req.profile?.theme_color
                  })}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base transition-all hover:scale-105 active:scale-95 overflow-hidden shadow-xs cursor-pointer"
                  style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}
                >
                  {req.profile?.logo_url ? (
                    <img src={req.profile.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    req.profile?.full_name ? req.profile.full_name[0] : '?'
                  )}
                </button>
                <div>
                  <h4 className="font-semibold text-navy text-sm">{req.profile?.full_name || 'Usuário Desconhecido'}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400 font-normal">Terceirizada</p>
                    {req.status === 'APPROVED_LIDER' && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md font-medium">
                        Autorizado pelo Líder
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl">
                  <p className="text-xs text-slate-500 font-medium mb-1">Setor Destino</p>
                  <p className="font-medium text-navy text-xs truncate">
                     {req.sector_info?.parent?.name ? (
                       <span className="text-slate-400 font-normal">{formatSectorName(req.sector_info.parent.name)} &gt; </span>
                     ) : null}
                     {formatSectorName(req.sector_info?.name || req.sector)}
                  </p>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl">
                  <p className="text-xs text-slate-500 font-medium mb-1">Horário Previsto</p>
                  <p className="font-medium text-navy text-xs">{formatDateTime(req.entry_date).time}</p>
                </div>
              </div>
            </div>

            {/* Pré-visualização dos Equipamentos */}
            <div className="flex-1 w-full md:border-l md:border-slate-100 md:pl-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs text-slate-500 font-medium">Equipamentos liberados ({req.materials.length})</p>
                <button 
                  onClick={() => setSelectedRequest(req)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Ver Todos
                </button>
              </div>
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                {req.materials.slice(0, 3).map((mat: any) => (
                  <button 
                    key={mat.id} 
                    onClick={() => setSelectedMaterial(mat)}
                    className="w-full flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 p-2.5 rounded-xl text-xs font-medium text-navy transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                      <span className="truncate">{mat.name}</span>
                    </div>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-md shadow-xs border border-slate-200/60 shrink-0 text-slate-600 font-medium">Detalhes</span>
                  </button>
                ))}
                {req.materials.length > 3 && (
                   <p className="text-[11px] text-slate-400 font-normal text-center mt-2 italic">+ {req.materials.length - 3} itens adicionais</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Modal Inventário */}
      {selectedRequest && (
        <div 
          onClick={() => setSelectedRequest(null)} 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200/80 flex flex-col max-h-[90vh] cursor-default"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
               <div>
                  <span className="text-xs font-semibold text-primary">Protocolo #{selectedRequest.id.slice(0, 8)}</span>
                  <h3 className="text-lg font-semibold text-navy">Inventário de Remessa</h3>
               </div>
               <button onClick={() => setSelectedRequest(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailItem label="Motorista" value={selectedRequest.driver_name || '---'} />
                  <DetailItem label="Placa" value={selectedRequest.plate || '---'} />
                  <DetailItem label="Setor" value={formatSectorName(selectedRequest.sector_info?.name || selectedRequest.sector)} />
                  <DetailItem label="Horário" value={formatDateTime(selectedRequest.entry_date).time} />
               </div>

               <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-3">Materiais ({selectedRequest.materials?.length || 0})</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                     {selectedRequest.materials?.map((mat: any) => (
                       <button 
                        key={mat.id} 
                        onClick={() => setSelectedMaterial(mat)}
                        className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/70 transition-colors group cursor-pointer text-left"
                       >
                          <div className="flex items-center gap-3 min-w-0">
                             <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center shrink-0 shadow-xs">
                                <Package className="w-4 h-4 text-primary" />
                             </div>
                             <div className="truncate">
                                <p className="text-xs font-semibold text-navy truncate">{mat.name}</p>
                                <p className="text-[11px] text-slate-400 font-normal">Série: {mat.serial_number || 'Sem número'}</p>
                             </div>
                          </div>
                          <span className="text-[11px] font-medium text-primary bg-primary/10 px-3 py-1 rounded-lg shrink-0">
                             Ver Specs
                          </span>
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
               <button onClick={() => setSelectedRequest(null)} className="px-5 py-2.5 bg-navy hover:bg-[#002880] text-white font-medium text-xs rounded-xl transition-all shadow-xs cursor-pointer">
                  Fechar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <div 
          onClick={() => setSelectedMaterial(null)} 
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-navy/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-xl max-h-[90vh] my-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col border border-slate-200/80 cursor-default"
          >
            {/* Header fixo no topo */}
            <div className="bg-navy px-5 py-4 flex justify-between items-center shrink-0 text-white border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider leading-none">Equipamento</p>
                  <h3 className="font-bold text-sm text-white truncate mt-0.5">{selectedMaterial.name}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMaterial(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com scroll perfeito no mobile e desktop */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {/* Imagem do equipamento otimizada e sem distorção */}
              <div className="w-full bg-slate-900/5 rounded-2xl overflow-hidden border border-slate-200/70 h-48 sm:h-64 flex items-center justify-center relative">
                {selectedMaterial.image_url || selectedMaterial.imageUrl ? (
                  <img 
                    src={selectedMaterial.image_url || selectedMaterial.imageUrl} 
                    alt={selectedMaterial.name} 
                    className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                    <Package className="w-10 h-10 opacity-30 mb-2" />
                    <p className="text-xs font-medium">Sem imagem anexada</p>
                  </div>
                )}
              </div>

              {/* Status / Condição */}
              <div className="flex items-center justify-between bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Condição do Item</span>
                <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-md border border-primary/20">
                  {selectedMaterial.condition || 'Usado'}
                </span>
              </div>

              {/* Grid de Especificações */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium mb-0.5 uppercase tracking-wider">Fabricante</p>
                  <p className="font-semibold text-navy text-xs sm:text-sm truncate">{selectedMaterial.brand || '---'}</p>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium mb-0.5 uppercase tracking-wider">Modelo</p>
                  <p className="font-semibold text-navy text-xs sm:text-sm truncate">{selectedMaterial.model || '---'}</p>
                </div>
                <div className="col-span-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium mb-0.5 uppercase tracking-wider">Nº de Série</p>
                  <p className="font-semibold text-navy text-xs sm:text-sm font-mono truncate">{selectedMaterial.serial_number || '---'}</p>
                </div>
              </div>

              {selectedMaterial.description && (
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Descrição / Observação</p>
                  <p className="text-xs text-navy font-medium italic leading-relaxed whitespace-pre-wrap">"{selectedMaterial.description}"</p>
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button 
                onClick={() => setSelectedMaterial(null)} 
                className="w-full bg-navy hover:bg-[#002880] text-white font-medium text-xs py-3 rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div 
          onClick={() => setSelectedCompany(null)} 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200/80 cursor-default"
          >
             <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                   <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xs"
                    style={{ backgroundColor: selectedCompany.theme_color || '#0032A0' }}
                   >
                      {selectedCompany.logo_url ? (
                        <img src={selectedCompany.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedCompany.full_name ? selectedCompany.full_name[0] : '?'
                      )}
                   </div>
                   <button 
                    onClick={() => setSelectedCompany(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="mb-6">
                   <span className="text-xs font-semibold text-primary">Perfil da Empresa</span>
                   <h3 className="text-lg font-semibold text-navy mt-0.5">{selectedCompany.full_name}</h3>
                </div>

                <div className="space-y-4">
                   <DetailItem label="Representante" value={selectedCompany.representative_name || 'Não informado'} />
                   <DetailItem label="CNPJ" value={selectedCompany.cnpj || 'Não informado'} />
                   <DetailItem label="Telefone" value={selectedCompany.phone || 'Não informado'} />
                </div>

                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-navy hover:bg-[#002880] text-white font-medium text-xs py-3 rounded-xl mt-6 transition-all shadow-xs cursor-pointer"
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

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-slate-50/70 border border-slate-100 p-2.5 rounded-xl">
       <p className="text-[10px] font-medium text-slate-400 mb-0.5">{label}</p>
       <p className="font-semibold text-navy text-xs truncate">{value}</p>
    </div>
  );
}
