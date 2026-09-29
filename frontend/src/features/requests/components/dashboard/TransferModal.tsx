import React, { useState } from 'react';
import { X, Send, Loader2, ChevronDown, Camera, Upload, Hash } from 'lucide-react';
import { useDashboard } from '../../../../contexts/DashboardContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { WebcamModal } from '../../../../components/WebcamModal';
import { compressImage } from '../../../../utils/imageCompressor';
import Swal from 'sweetalert2';

interface TransferModalProps {
  materialIds: string[];
  onClose: () => void;
  onConfirm: (toSectorId: string, signature: string, extraData?: any, photos?: string[]) => Promise<void>;
  isProcessing: boolean;
  currentSectorId?: string;
  currentSectorName?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({ 
  materialIds, 
  onClose, 
  onConfirm,
  isProcessing,
  currentSectorId,
  currentSectorName
}) => {
  const { sectors } = useDashboard();
  const { profile } = useAuth();
  const [selectedParentSector, setSelectedParentSector] = useState('');
  const [selectedSubSector, setSelectedSubSector] = useState('');
  const [signature, setSignature] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [observation, setObservation] = useState('');
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  // Identifica o setor de origem (onde o material já está alocado)
  const originSectorId = currentSectorId || profile?.sector_id;
  const originSectorName = (currentSectorName || profile?.sector || '').trim().toLowerCase();

  const isCurrentSector = (s: any) => {
    if (!s) return false;
    if (originSectorId && s.id === originSectorId) return true;
    if (originSectorName && s.name && s.name.trim().toLowerCase() === originSectorName) return true;
    return false;
  };

  // Filtra as áreas gerais e remove o próprio setor caso seja um parent sem outros filhos
  const parentSectors = sectors
    .filter(s => !s.parent_id)
    .filter(s => !isCurrentSector(s) || sectors.some(child => child.parent_id === s.id && !isCurrentSector(child)));

  // Filtra os locais específicos removendo SEMPRE o próprio setor atual do líder/material
  const subSectors = sectors
    .filter(s => s.parent_id === selectedParentSector)
    .filter(s => !isCurrentSector(s));

  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setPhotos(prev => [...prev, compressed]);
      } catch (err) {
        console.error('Erro ao comprimir imagem:', err);
      }
    }
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const validateSignature = () => {
    const cleanSignature = signature.trim().toUpperCase();
    const userReg = profile?.registration_number?.trim().toUpperCase();

    if (!cleanSignature) {
      Swal.fire({
        title: 'Matrícula Obrigatória',
        text: 'Por favor, informe a matrícula do responsável para confirmar.',
        icon: 'warning',
        confirmButtonColor: '#0052cc',
        customClass: {
          popup: 'rounded-2xl font-brand',
          confirmButton: 'rounded-xl font-bold uppercase text-xs px-6 py-3'
        }
      });
      return false;
    }

    if (profile?.role !== 'SUPER_ADMIN') {
      if (!userReg) {
        Swal.fire({
          title: 'Matrícula Não Cadastrada',
          text: 'Seu usuário não possui matrícula cadastrada no sistema. Contate o administrador.',
          icon: 'error',
          confirmButtonColor: '#0052cc',
          customClass: {
            popup: 'rounded-2xl font-brand',
            confirmButton: 'rounded-xl font-bold uppercase text-xs px-6 py-3'
          }
        });
        return false;
      }

      if (cleanSignature !== userReg) {
        Swal.fire({
          title: 'Matrícula Inválida!',
          text: 'A matrícula informada não confere com o responsável por este setor.',
          icon: 'error',
          confirmButtonColor: '#0052cc',
          customClass: {
            popup: 'rounded-2xl font-brand',
            confirmButton: 'rounded-xl font-bold uppercase text-xs px-6 py-3'
          }
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSector) return;

    const chosenSector = sectors.find(s => s.id === selectedSubSector);
    if (isCurrentSector(chosenSector) || selectedSubSector === originSectorId) {
      Swal.fire({
        title: 'Destino Inválido',
        text: 'O setor de destino deve ser diferente do setor de origem onde o equipamento já está.',
        icon: 'warning',
        confirmButtonColor: '#0052cc',
        customClass: {
          popup: 'rounded-2xl font-brand',
          confirmButton: 'rounded-xl font-bold uppercase text-xs px-6 py-3'
        }
      });
      return;
    }

    if (!validateSignature()) return;
    
    onConfirm(selectedSubSector, signature.trim(), { observation }, photos.length > 0 ? photos : undefined);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-navy/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      >
        <div 
          className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Horizontal Compacto & Elegante */}
          <div className="bg-navy px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black uppercase text-base sm:text-lg tracking-tight">Movimentação Interna</h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/20 text-cyan-300 border border-primary/30">
                    {materialIds.length} {materialIds.length > 1 ? 'itens' : 'item'}
                  </span>
                </div>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  Transferência de custódia entre setores internos
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form em 2 Colunas Horizontais */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Coluna Esquerda: Destino & Autorização */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Setor Geral */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">
                      Área de Destino Geral
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedParentSector}
                        onChange={(e) => {
                          setSelectedParentSector(e.target.value);
                          setSelectedSubSector('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-navy appearance-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer"
                        required
                      >
                        <option value="">SELECIONE A ÁREA GERAL...</option>
                        {parentSectors.map(s => (
                          <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Sub-setor / Local */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">
                      Sub-setor / Local Específico
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedSubSector}
                        onChange={(e) => setSelectedSubSector(e.target.value)}
                        disabled={!selectedParentSector}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-navy appearance-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">{selectedParentSector ? 'SELECIONE O LOCAL ESPECÍFICO...' : 'PRIMEIRO ESCOLHA A ÁREA GERAL'}</option>
                        {subSectors.map(s => (
                          <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Matrícula do Responsável */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                        Matrícula do Líder
                      </label>
                      {profile?.registration_number && (
                        <button 
                          type="button"
                          onClick={() => setSignature(profile.registration_number || '')}
                          className="text-[9px] font-black text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Usar Minha: {profile.registration_number}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="DIGITE SUA MATRÍCULA..."
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-xs font-black text-navy uppercase tracking-widest focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                        required
                      />
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Botão de Envio */}
                <button 
                  type="submit"
                  disabled={!selectedSubSector || !signature || isProcessing}
                  className="w-full bg-primary hover:bg-[#009e96] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer mt-4"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirmar Transferência
                    </>
                  )}
                </button>
              </div>

              {/* Coluna Direita: Fotos & Observações */}
              <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  {/* Header Fotos */}
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                      Evidências Fotográficas ({photos.length})
                    </label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setIsWebcamOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 rounded-lg transition-all text-[9px] font-black uppercase cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Câmera</span>
                      </button>
                      <label className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 rounded-lg transition-all text-[9px] font-black uppercase cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Galeria</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleCapturePhoto} />
                      </label>
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {photos.map((p, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden relative group/img shadow-xs border border-slate-200">
                          <img src={p} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110 shadow-sm cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white/60 rounded-xl border border-dashed border-slate-200 text-center mb-3">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Opcional • Fotos do estado do equipamento
                      </p>
                    </div>
                  )}

                  {/* Observação */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">
                      Observação / Estado do Equipamento
                    </label>
                    <textarea 
                      placeholder="Descreva o estado do equipamento para o setor de destino..."
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-navy placeholder:text-slate-300 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none min-h-[90px] custom-scrollbar"
                    />
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>

      {isWebcamOpen && (
        <WebcamModal 
          onClose={() => setIsWebcamOpen(false)}
          onCapture={(imageSrc) => {
            setPhotos(prev => [...prev, imageSrc]);
            setIsWebcamOpen(false);
          }}
        />
      )}
    </>
  );
};
