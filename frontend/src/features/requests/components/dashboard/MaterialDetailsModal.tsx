import React, { useState } from 'react';
import { 
  Package, 
  X, 
  History, 
  ArrowRight, 
  Clock, 
  User, 
  FileText, 
  Camera, 
  Eye, 
  AlertTriangle,
  Building,
  CheckCircle2
} from 'lucide-react';

interface MovementRecord {
  id?: string;
  moved_at: string;
  photos?: string[];
  signature?: string;
  observation?: string;
  from_sector?: { id?: string; name: string };
  to_sector?: { id?: string; name: string };
  actor?: { full_name?: string; registration_number?: string };
}

interface MaterialDetailsModalProps {
  material: any;
  onClose: () => void;
  onSelectCompany?: (company: any) => void;
}

export const MaterialDetailsModal: React.FC<MaterialDetailsModalProps> = ({ 
  material, 
  onClose,
  onSelectCompany 
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  const movements: MovementRecord[] = [...(material.movements || [])].sort(
    (a, b) => new Date(b.moved_at).getTime() - new Date(a.moved_at).getTime()
  );

  const company = material.request?.profile;
  const entryDate = material.entry_at 
    ? new Date(material.entry_at).toLocaleDateString('pt-BR') 
    : (material.request?.entry_date ? new Date(material.request.entry_date).toLocaleDateString('pt-BR') : '---');

  const openPhotosViewer = (photos: string[], startIdx: number = 0) => {
    setSelectedPhotos(photos);
    setActivePhotoIdx(startIdx);
  };

  return (
    <>
      <div 
        onClick={onClose} 
        className="fixed inset-0 z-[1300] flex items-center justify-center p-3 md:p-6 bg-navy/80 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer overflow-y-auto"
      >
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col cursor-default animate-in zoom-in-95 duration-200 my-auto border border-slate-100"
        >
          {/* Header com Design Premium */}
          <div className="bg-navy p-6 md:p-8 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-start text-white">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner shrink-0 text-primary">
                  <Package className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-primary/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-primary/30">
                      {material.condition || 'USADO'}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                      material.status === 'IN_PLANTA' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      material.status === 'MOVING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-white/10 text-white/70 border-white/10'
                    }`}>
                      {material.status === 'MOVING' ? 'Em Trânsito' : material.status === 'IN_PLANTA' ? 'Em Planta' : (material.status || 'Ativo')}
                    </span>
                  </div>
                  <h3 className="font-black uppercase text-lg md:text-2xl tracking-tighter leading-tight truncate text-white">
                    {material.name}
                  </h3>
                </div>
              </div>

              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/10 shrink-0 text-white/60 hover:text-white cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Equipment Image & Company Badge */}
              <div className="md:col-span-1 flex flex-col gap-3">
                <div className="bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 aspect-square flex items-center justify-center relative group shadow-inner">
                  {material.image_url || material.imageUrl ? (
                    <img 
                      src={material.image_url || material.imageUrl} 
                      alt={material.name} 
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                      <Package size={48} className="mb-2 opacity-40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sem Foto Inicial</span>
                    </div>
                  )}
                </div>

                {/* Card da Empresa Responsável */}
                {company && (
                  <button
                    type="button"
                    onClick={() => onSelectCompany && onSelectCompany(company)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left group shadow-sm cursor-pointer"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden shrink-0"
                      style={{ backgroundColor: company.theme_color || '#0032A0' }}
                    >
                      {company.logo_url ? (
                        <img src={company.logo_url} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        company.full_name ? company.full_name[0] : '?'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Empresa Proprietária
                      </p>
                      <p className="text-xs font-bold text-navy uppercase truncate group-hover:text-primary transition-colors">
                        {company.full_name}
                      </p>
                      {company.cnpj && (
                        <p className="text-[9px] font-mono text-slate-400 truncate">
                          {company.cnpj}
                        </p>
                      )}
                    </div>
                  </button>
                )}
              </div>

              {/* Specifications Card */}
              <div className="md:col-span-2 bg-slate-50/70 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Nº de Série" value={material.serial_number || 'Não informado'} />
                  <DetailItem label="Código Patrimônio" value={material.code || '---'} />
                  <DetailItem label="Fabricante / Marca" value={material.brand || '---'} />
                  <DetailItem label="Modelo" value={material.model || '---'} />
                  <DetailItem label="Empresa Responsável" value={company?.full_name || '---'} />
                  <DetailItem label="Data de Entrada" value={entryDate} />
                </div>

                {material.description && (
                  <div className="mt-4 pt-4 border-t border-slate-200/60">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Descrição do Cadastro</p>
                    <p className="text-xs text-navy font-medium italic">"{material.description}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Divergência se houver */}
            {(material.request?.rejection_reason || material.request?.status === 'DISCREPANCY') && (
              <div className="bg-amber-50 p-4 md:p-5 rounded-2xl border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Divergência / Observação Registrada na Portaria</p>
                  <p className="text-xs text-amber-900 font-bold leading-relaxed mt-1">
                    {material.request?.rejection_reason || 'Divergência apontada durante a inspeção física dos equipamentos.'}
                  </p>
                </div>
              </div>
            )}

            {/* Histórico de Passagens pelos Setores */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <History size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-navy uppercase text-sm tracking-tight">
                      Histórico de Passagens & Evidências
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Rastro completo por setores com fotos e observações de estado
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                  {movements.length} {movements.length === 1 ? 'Passagem' : 'Passagens'}
                </span>
              </div>

              {movements.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500 font-black uppercase tracking-wider">
                    Nenhuma transferência entre setores registrada ainda.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Assim que o equipamento for transferido entre setores industriais, o histórico com fotos e observações aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {movements.map((move, index) => {
                    const photos = move.photos || [];
                    const hasPhotos = photos.length > 0;
                    const hasObservation = Boolean(move.observation?.trim());
                    const formattedDate = new Date(move.moved_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                    const formattedTime = new Date(move.moved_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const actorSignature = move.signature ? ` (${move.signature})` : '';

                    return (
                      <div 
                        key={move.id || index}
                        className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 hover:border-primary/30 transition-all shadow-sm group"
                      >
                        {/* Top Bar of Movement */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0">
                              #{movements.length - index}
                            </span>
                            <span className="font-black text-navy text-xs md:text-sm uppercase tracking-tight">
                              {move.from_sector?.name || 'Portaria / Entrada'}
                            </span>
                            <ArrowRight size={14} className="text-primary shrink-0" />
                            <span className="font-black text-primary text-xs md:text-sm uppercase tracking-tight">
                              {move.to_sector?.name || 'Setor Destino'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-primary" /> {formattedDate} às {formattedTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User size={12} className="text-primary" /> {move.actor?.full_name || 'Responsável'}{actorSignature}
                            </span>
                          </div>
                        </div>

                        {/* Observation Box */}
                        {hasObservation ? (
                          <div className="mt-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                            <FileText size={16} className="text-primary shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                Observação / Estado do Equipamento:
                              </p>
                              <p className="text-xs font-semibold text-navy mt-1 leading-relaxed whitespace-pre-wrap">
                                "{move.observation}"
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic mt-3">
                            Sem observação descritiva registrada nesta passagem.
                          </p>
                        )}

                        {/* Photos Thumbnails */}
                        {hasPhotos && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2.5">
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                <Camera size={12} className="text-primary" /> Evidências Fotográficas ({photos.length})
                              </p>
                              <span 
                                className="text-[9px] font-black text-primary uppercase cursor-pointer hover:underline" 
                                onClick={() => openPhotosViewer(photos, 0)}
                              >
                                Ver em tela cheia
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {photos.map((photoUrl, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => openPhotosViewer(photos, pIdx)}
                                  className="group/photo relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-slate-200 hover:border-primary transition-all shadow-sm active:scale-95 cursor-pointer"
                                  title="Clique para ampliar a foto"
                                >
                                  <img 
                                    src={photoUrl} 
                                    alt="" 
                                    className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-300" 
                                  />
                                  <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye size={16} />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
            <button 
              onClick={onClose} 
              className="w-full md:w-auto px-8 bg-navy hover:bg-[#002880] text-white font-bold text-xs uppercase py-3.5 rounded-xl transition-all active:scale-95 shadow-md cursor-pointer"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      </div>

      {/* Visualizador de Fotos em Tela Cheia */}
      {selectedPhotos && (
        <div 
          onClick={() => setSelectedPhotos(null)} 
          className="fixed inset-0 z-[1500] flex items-center justify-center p-4 md:p-8 bg-navy/95 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-5xl h-full flex flex-col cursor-default"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl text-white">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Evidências Fotográficas</h3>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                    Foto {activePhotoIdx + 1} de {selectedPhotos.length}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPhotos(null)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Imagem Principal */}
            <div className="flex-1 flex items-center justify-center overflow-hidden rounded-3xl bg-black/40 border border-white/10 relative p-4">
              <img 
                src={selectedPhotos[activePhotoIdx]} 
                alt="" 
                className="max-h-full max-w-full object-contain rounded-2xl drop-shadow-2xl" 
              />
            </div>

            {/* Carrossel de Miniaturas */}
            {selectedPhotos.length > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4 overflow-x-auto py-2">
                {selectedPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIdx === idx ? 'border-primary scale-105 shadow-lg' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className="font-bold text-navy text-xs md:text-sm uppercase truncate">{value}</p>
    </div>
  );
}
