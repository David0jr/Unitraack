import React, { useState } from 'react';
import { X, ShieldCheck, Loader2, Package } from 'lucide-react';
import { SignaturePad } from '../../../../components/SignaturePad';

interface AcceptModalProps {
  materialName: string;
  onClose: () => void;
  onConfirm: (signature: string) => Promise<void>;
  isProcessing: boolean;
}

export const AcceptModal: React.FC<AcceptModalProps> = ({ 
  materialName, 
  onClose, 
  onConfirm,
  isProcessing
}) => {
  const [signature, setSignature] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) return;
    onConfirm(signature);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="bg-navy p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold uppercase text-sm tracking-tight">Aceitar Transferência</h3>
              <p className="text-[9px] text-primary font-bold uppercase tracking-widest mt-0.5">Confirmação de Recebimento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Equipamento</p>
            <p className="text-sm font-black text-navy uppercase">{materialName}</p>
          </div>

          <SignaturePad 
            placeholder="Assinatura de Recebimento"
            onSave={setSignature}
            onClear={() => setSignature('')}
          />

          <button 
            type="submit"
            disabled={!signature || isProcessing}
            className="w-full bg-primary hover:bg-[#009e96] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Confirmar Recebimento
          </button>
        </form>
      </div>
    </div>
  );
};
