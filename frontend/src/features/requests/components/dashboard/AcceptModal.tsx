import React, { useState } from 'react';
import { X, ShieldCheck, Loader2, Package, Camera, Hash } from 'lucide-react';

interface AcceptModalProps {
  materialName: string;
  onClose: () => void;
  onConfirm: (signature: string, photos?: string[]) => Promise<void>;
  isProcessing: boolean;
}

export const AcceptModal: React.FC<AcceptModalProps> = ({ 
  materialName, 
  onClose, 
  onConfirm,
  isProcessing
}) => {
  const [signature, setSignature] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

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
    if (!signature) return;
    onConfirm(signature, photos.length > 0 ? photos : undefined);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="bg-navy p-6 flex justify-between items-center text-white shrink-0">
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

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Equipamento</p>
            <p className="text-sm font-black text-navy uppercase">{materialName}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Evidência Fotográfica</p>
              <div className="flex gap-2">
                <label className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturePhoto} />
                </label>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                    <img src={p} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3 pt-4 border-t border-slate-100 group">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block transition-colors group-focus-within:text-primary">Matrícula de Recebimento</label>
            </div>
            <input 
              type="text" 
              placeholder="DIGITE SUA MATRÍCULA PARA CONFIRMAR..."
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-navy placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-black text-sm tracking-widest uppercase"
              required
            />
          </div>

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
