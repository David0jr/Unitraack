import React, { useState } from 'react';
import { Clock, Loader2, Check, Package, XCircle, LogOut } from 'lucide-react';
import { useDashboard } from '../../../../contexts/DashboardContext';

export const PendingApprovals: React.FC = () => {
  const { requests, loading } = useDashboard();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
        <p className="mt-4 text-slate-300 font-bold text-[10px] uppercase tracking-widest">Sincronizando dados operativos...</p>
      </div>
    );
  }

  const authorizedRequests = requests.filter(req => req.status === 'APPROVED' || req.status === 'APPROVED_LIDER');

  if (authorizedRequests.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-4">
        <Check className="w-12 h-12 text-emerald-400 bg-emerald-50 p-3 rounded-full" />
        <div>
          <p className="text-navy font-bold text-sm uppercase">Nenhum aviso de entrada</p>
          <p className="text-slate-400 text-xs mt-1">Não há materiais autorizados pelos líderes aguardando acesso.</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-navy text-xs uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Avisos de Entrada (Autorizadas pelos Líderes)
        </h3>
        <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">Controle de Portaria</span>
      </div>

      {authorizedRequests.map(req => (
        <div key={req.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-primary/20 transition-all group">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Driver Info */}
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
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 overflow-hidden shadow-md"
                  style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}
                >
                  {req.profile?.logo_url ? (
                    <img src={req.profile.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    req.profile?.full_name ? req.profile.full_name[0] : '?'
                  )}
                </button>
                <div>
                  <h4 className="font-bold text-navy text-sm uppercase">{req.profile?.full_name || 'Usuário Desconhecido'}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Terceirizada</p>
                    {req.status === 'APPROVED_LIDER' && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Autorizado pelo Líder</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Setor Destino</p>
                  <p className="font-bold text-navy text-xs truncate">
                     {req.sector_info?.parent?.name ? (
                       <span className="opacity-40">{req.sector_info.parent.name} &gt; </span>
                     ) : null}
                     {req.sector_info?.name || req.sector}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Horário Previsto</p>
                  <p className="font-bold text-navy text-xs">{formatDateTime(req.entry_date).time}</p>
                </div>
              </div>
            </div>

            {/* Materials Preview */}
            <div className="flex-1 w-full md:border-l md:border-slate-50 md:pl-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Equipamentos Liberados ({req.materials.length})</p>
                <button 
                  onClick={() => setSelectedRequest(req)}
                  className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Ver Tudo
                </button>
              </div>
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {req.materials.slice(0, 3).map((mat: any) => (
                  <button 
                    key={mat.id} 
                    onClick={() => setSelectedMaterial(mat)}
                    className="w-full flex items-center justify-between bg-slate-50/50 p-2 rounded-xl text-[10px] font-bold text-navy hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                      <span className="truncate">{mat.name}</span>
                    </div>
                    <span className="text-[8px] bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100 flex-shrink-0">Detalhes</span>
                  </button>
                ))}
                {req.materials.length > 3 && (
                   <p className="text-[9px] text-slate-300 font-bold text-center mt-2 italic">+ {req.materials.length - 3} itens adicionais</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Modals */}
      {selectedRequest && (
        <div 
          onClick={() => setSelectedRequest(null)} 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh] cursor-default"
          >
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center">
               <div>
                  <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-widest">Protocolo #{selectedRequest.id.slice(0, 8)}</span>
                  <h3 className="text-xl md:text-2xl font-bold text-navy uppercase tracking-tighter">Inventário de Remessa</h3>
               </div>
               <button onClick={() => setSelectedRequest(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all">
                  <XCircle className="w-5 h-5 md:w-6 md:h-6" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
                  <DetailItem label="Motorista" value={selectedRequest.driver_name} />
                  <DetailItem label="Placa" value={selectedRequest.plate} />
                  <DetailItem label="Setor" value={selectedRequest.sector_info?.name || selectedRequest.sector} />
                  <DetailItem label="Horário" value={formatDateTime(selectedRequest.entry_date).time} />
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Materiais ({selectedRequest.materials?.length || 0})</h4>
                  <div className="grid grid-cols-1 gap-3">
                     {selectedRequest.materials?.map((mat: any) => (
                       <button 
                        key={mat.id}
                        onClick={() => setSelectedMaterial(mat)}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/30 transition-all group"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <Package className="w-5 h-5 text-primary" />
                             </div>
                             <div className="text-left">
                                <p className="text-xs font-bold text-navy uppercase leading-none mb-1">{mat.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SN: {mat.serial_number || 'REGISTRO ÚNICO'}</p>
                             </div>
                          </div>
                          <div className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                             Ver Foto/Specs
                          </div>
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-50">
               <button onClick={() => setSelectedRequest(null)} className="w-full py-4 bg-navy text-white font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-primary transition-all shadow-xl">
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
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-2xl rounded-[16px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[85vh] border border-slate-200 cursor-default"
          >
            <div className="md:w-[40%] relative bg-slate-900 flex-shrink-0 min-h-[220px]">
              {selectedMaterial.image_url || selectedMaterial.imageUrl ? (
                <img 
                  src={selectedMaterial.image_url || selectedMaterial.imageUrl} 
                  alt={selectedMaterial.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                  <Package className="w-8 h-8 opacity-10" />
                  <p className="text-[8px] font-bold uppercase tracking-widest mt-2">Sem imagem</p>
                </div>
              )}
            </div>
            <div className="md:w-[60%] flex flex-col overflow-hidden bg-white">
              <div className="bg-navy px-5 py-3 flex justify-between items-center flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/20 rounded-md">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[7px] text-primary font-bold uppercase tracking-widest leading-none">Ativo Industrial</p>
                      <h3 className="text-white font-bold uppercase text-[11px] mt-0.5 tracking-tight truncate max-w-[160px]">{selectedMaterial.name}</h3>
                    </div>
                 </div>
                 <button onClick={() => setSelectedMaterial(null)} className="w-6 h-6 bg-white/10 hover:bg-white/20 text-white rounded-md flex items-center justify-center transition-all">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Especificações Técnicas</span>
                    <span className="bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-md uppercase border border-primary/20">
                      Condição: {selectedMaterial.condition}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Fabricante</p>
                      <p className="font-bold text-navy text-[10px] truncate">{selectedMaterial.brand || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Modelo</p>
                      <p className="font-bold text-navy text-[10px] truncate">{selectedMaterial.model || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Nº de Série</p>
                      <p className="font-bold text-navy text-[10px] font-mono tracking-tighter truncate">{selectedMaterial.serial_number || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Patrimônio</p>
                      <p className="font-bold text-navy text-[10px] font-mono tracking-tighter truncate">{selectedMaterial.code || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 pt-2">
                <button onClick={() => setSelectedMaterial(null)} className="w-full bg-navy text-white font-bold text-[9px] uppercase tracking-widest py-3 rounded-lg hover:bg-primary transition-all shadow-md active:scale-[0.98]">
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div 
          onClick={() => setSelectedCompany(null)} 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-slate-200 cursor-default"
          >
             <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                   <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl"
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
                    className="p-2 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all"
                   >
                     <LogOut className="w-6 h-6 rotate-180" />
                   </button>
                </div>

                <div className="mb-8">
                   <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Perfil da Empresa</span>
                   <h3 className="text-2xl font-bold text-navy uppercase leading-tight mt-1">{selectedCompany.full_name}</h3>
                </div>

                <div className="space-y-6">
                   <DetailItem label="Representante" value={selectedCompany.representative_name || 'NÃO INFORMADO'} />
                   <DetailItem label="CNPJ" value={selectedCompany.cnpj || 'NÃO INFORMADO'} />
                   <DetailItem label="Telefone" value={selectedCompany.phone || 'NÃO INFORMADO'} />
                </div>

                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-navy text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl mt-10 hover:bg-[#002880] transition-all shadow-xl shadow-navy/20"
                >
                  Fechar Detalhes
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
    <div className="flex flex-col">
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
       <p className="font-bold text-navy text-sm uppercase">{value}</p>
    </div>
  );
}


