import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, placeholder }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    onClear?.();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-3">
      {placeholder && (
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block ml-1">
          {placeholder}
        </label>
      )}
      <div className="relative bg-slate-50/30 border-2 border-slate-100/50 rounded-[2rem] overflow-hidden group focus-within:border-primary/50 focus-within:bg-white transition-all shadow-inner">
        <SignatureCanvas 
          ref={sigCanvas}
          penColor="#0032A0"
          canvasProps={{
            className: "w-full h-44 cursor-crosshair",
          }}
          onEnd={save}
        />
        
        <div className="absolute bottom-5 right-5 flex gap-2">
          <button 
            type="button"
            onClick={clear}
            className="w-12 h-12 flex items-center justify-center bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm border border-slate-100"
            title="Limpar Assinatura"
          >
            <Eraser className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador visual de que pode desenhar */}
        <div className="absolute top-6 left-6 pointer-events-none opacity-20 group-hover:opacity-10 transition-opacity flex items-center gap-2">
           <PenTool className="w-3 h-3 text-navy" />
           <p className="text-[10px] font-black uppercase tracking-widest text-navy">Desenhe sua assinatura aqui</p>
        </div>
      </div>
      <p className="text-[9px] text-slate-400 font-medium italic ml-2">
        * Use o mouse ou o dedo para assinar no campo acima de forma legível.
      </p>
    </div>
  );
};
