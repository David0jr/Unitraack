import React, { useState } from 'react';
import { X, Send, ShieldCheck, Loader2, ChevronDown, Package, ClipboardCheck, Info, Camera } from 'lucide-react';
import { useDashboard } from '../../../../contexts/DashboardContext';
import { SignaturePad } from '../../../../components/SignaturePad';

interface TransferModalProps {
  materialIds: string[];
  onClose: () => void;
  onConfirm: (toSectorId: string, signature: string, extraData?: any, photos?: string[]) => Promise<void>;
  isProcessing: boolean;
}

export const TransferModal: React.FC<TransferModalProps> = ({ 
  materialIds, 
  onClose, 
  onConfirm,
  isProcessing
}) => {
  const { sectors } = useDashboard();
  const [selectedParentSector, setSelectedParentSector] = useState('');
  const [selectedSubSector, setSelectedSubSector] = useState('');
  const [signature, setSignature] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Novos campos para fluxo de Portaria
  const [transferType, setTransferType] = useState('TOTAL');
  const [exitReason, setExitReason] = useState('CONCLUSÃO DO SERVIÇO');

  const parentSectors = sectors.filter(s => !s.parent_id);
  const subSectors = sectors.filter(s => s.parent_id === selectedParentSector);

  const selectedSectorObj = sectors.find(s => s.id === (selectedSubSector || selectedParentSector));
  const isPortaria = selectedSectorObj?.name?.toUpperCase().includes('PORTARIA');

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSectorId = selectedSubSector || selectedParentSector;
    if (subSectors.length > 0 && !selectedSubSector) return;
    if (!finalSectorId || !signature) return;
    
    const extraData = isPortaria ? { transferType, exitReason } : undefined;
    onConfirm(finalSectorId, signature, extraData, photos.length > 0 ? photos : undefined);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-4 bg-navy/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md max-h-[95vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header - Premium Style (Fixed) */}
        <div className="bg-navy p-6 md:p-8 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="relative z-10 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                <Send className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold uppercase text-sm md:text-base tracking-tighter leading-none">Movimentação <span className="text-primary italic">Interna</span></h3>
                <p className="text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1 md:mt-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  Protocolo de Transferência
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto max-h-full custom-scrollbar">
            {/* Summary Card */}
            <div className="bg-slate-50/50 p-4 md:p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Itens Selecionados</span>
              </div>
              <span className="bg-navy text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-navy/20">{materialIds.length}</span>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="group">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 ml-1 block transition-colors group-focus-within:text-primary">Setor de Destino (Geral)</label>
                <div className="relative">
                  <select 
                    value={selectedParentSector}
                    onChange={(e) => {
                      setSelectedParentSector(e.target.value);
                      setSelectedSubSector('');
                    }}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 md:py-4 text-sm font-bold text-navy appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none shadow-sm cursor-pointer"
                    required
                  >
                    <option value="">SELECIONE A ÁREA...</option>
                    {parentSectors.map(s => (
                      <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              {selectedParentSector && subSectors.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500 group">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 ml-1 block transition-colors group-focus-within:text-primary">Sub-setor / Local Específico</label>
                  <div className="relative">
                    <select 
                      value={selectedSubSector}
                      onChange={(e) => setSelectedSubSector(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 md:py-4 text-sm font-bold text-navy appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none shadow-sm cursor-pointer"
                      required
                    >
                      <option value="">SELECIONE O LOCAL...</option>
                      {subSectors.map(s => (
                        <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within:text-primary transition-colors" />
                  </div>
                </div>
              )}

              {/* Foto de Evidência */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Evidência Fotográfica</label>
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all cursor-pointer group">
                    <Camera className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">Capturar</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturePhoto} />
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {photos.map((p, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden relative group/img shadow-sm border border-slate-200">
                        <img src={p} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-all shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fluxo de Saída para Portaria */}
              {isPortaria && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-4 flex items-center gap-3">
                    <Info className="w-5 h-5 text-primary" />
                    <p className="text-[10px] text-primary font-bold uppercase tracking-tight">Fluxo de Baixa de Equipamento Terceirizado</p>
                  </div>

                  <div className="group">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 ml-1 block">Tipo de Saída</label>
                    <div className="relative">
                      <select 
                        value={transferType}
                        onChange={(e) => setTransferType(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-navy appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                        required
                      >
                        <option value="TOTAL">SAÍDA TOTAL</option>
                        <option value="PARCIAL">SAÍDA PARCIAL</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 ml-1 block">Motivo da Saída</label>
                    <div className="relative">
                      <select 
                        value={exitReason}
                        onChange={(e) => setExitReason(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-navy appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                        required
                      >
                        <option value="CONCLUSÃO DO SERVIÇO">CONCLUSÃO DO SERVIÇO</option>
                        <option value="MANUTENÇÃO DO EQUIPAMENTO">MANUTENÇÃO DO EQUIPAMENTO</option>
                        <option value="TROCA DE EQUIPAMENTO">TROCA DE EQUIPAMENTO</option>
                        <option value="OUTROS">OUTROS</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <SignaturePad 
              placeholder="Assinatura Digital do Responsável"
              onSave={setSignature}
              onClear={() => setSignature('')}
            />
          </div>

          {/* Footer - Fixed Button */}
          <div className="p-6 md:p-8 pt-0 shrink-0">
            <button 
              type="submit"
              //disabled={!selectedSubSector || !signature || isProcessing}
              className="w-full bg-navy hover:bg-[#001D4A]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[11px] md:text-xs uppercase tracking-widest py-4 md:py-5 rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,29,74,0.3)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin opacity-40" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Confirmar Transferência
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
