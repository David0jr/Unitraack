import React, { useState } from 'react';
import { X, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { useDashboard } from '../../../../contexts/DashboardContext';
import { SignaturePad } from '../../../../components/SignaturePad';

interface TransferModalProps {
  materialIds: string[];
  onClose: () => void;
  onConfirm: (toSectorId: string, signature: string) => Promise<void>;
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

  const parentSectors = sectors.filter(s => !s.parent_id);
  const subSectors = sectors.filter(s => s.parent_id === selectedParentSector);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSector || !signature) return;
    onConfirm(selectedSubSector, signature);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="bg-navy p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold uppercase text-sm tracking-tight">Transferir Equipamento</h3>
              <p className="text-[9px] text-primary font-bold uppercase tracking-widest mt-0.5">Movimentação Interna</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Itens Selecionados</span>
            <span className="bg-navy text-white text-[10px] font-bold px-3 py-1 rounded-full">{materialIds.length}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 block">Setor de Destino (Geral)</label>
              <select 
                value={selectedParentSector}
                onChange={(e) => {
                  setSelectedParentSector(e.target.value);
                  setSelectedSubSector('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-navy focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                required
              >
                <option value="">Selecione o setor...</option>
                {parentSectors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {selectedParentSector && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 block">Sub-setor / Local</label>
                <select 
                  value={selectedSubSector}
                  onChange={(e) => setSelectedSubSector(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-navy focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  required
                >
                  <option value="">Selecione o sub-setor...</option>
                  {subSectors.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <SignaturePad 
            placeholder="Assinatura Digital"
            onSave={setSignature}
            onClear={() => setSignature('')}
          />

          <button 
            type="submit"
            disabled={!selectedSubSector || !signature || isProcessing}
            className="w-full bg-primary hover:bg-[#009e96] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Confirmar Transferência
          </button>
        </form>
      </div>
    </div>
  );
};
