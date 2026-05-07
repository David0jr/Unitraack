import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';

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
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
          {placeholder}
        </label>
      )}
      <div className="relative bg-white border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-primary transition-all">
        <SignatureCanvas 
          ref={sigCanvas}
          penColor="#0032A0"
          canvasProps={{
            className: "w-full h-40 cursor-crosshair",
          }}
          onEnd={save}
        />
        
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button 
            type="button"
            onClick={clear}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
            title="Limpar Assinatura"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Indicador visual de que pode desenhar */}
        <div className="absolute top-4 left-4 pointer-events-none opacity-20 group-hover:opacity-10 transition-opacity">
           <p className="text-[10px] font-black uppercase tracking-widest text-navy">Desenhe sua assinatura aqui</p>
        </div>
      </div>
      <p className="text-[8px] text-slate-400 italic">
        * Use o mouse ou o dedo para assinar no campo acima.
      </p>
    </div>
  );
};
