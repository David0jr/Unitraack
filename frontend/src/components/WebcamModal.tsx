import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface WebcamModalProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export const WebcamModal: React.FC<WebcamModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = useCallback(async () => {
    try {
      setError('');
      // Tenta primeiro a câmera traseira
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } }
        });
      } catch (e) {
        // Fallback: se falhar (ex: no PC), pega qualquer câmera disponível
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      let errorMsg = 'Não foi possível acessar a câmera. Verifique as permissões do navegador ou se o dispositivo possui uma câmera ativa.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Você negou a permissão da câmera anteriormente. Por favor, clique no cadeado na barra de endereços do navegador, permita a câmera e recarregue a página.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'Nenhuma câmera foi encontrada neste dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Sua câmera já está sendo usada por outro aplicativo (ex: Zoom, Teams). Feche-o e tente novamente.';
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMsg = 'Para usar a câmera via rede Wi-Fi, o sistema precisa estar rodando com HTTPS ou em localhost.';
      }

      setError(errorMsg);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup happens inside the effect using a fresh reference to stream 
      // by pulling from videoRef to avoid dependency cycles with state.
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Espelhar horizontalmente se for câmera frontal, 
        // mas como pedimos 'environment', geralmente não precisa. 
        // Para garantir consistência vamos deixar natural.
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error ? (
          <div className="p-12 text-center text-white flex flex-col items-center justify-center min-h-[300px]">
            <Camera className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
            <p className="text-rose-400 mb-6 font-semibold">{error}</p>
            <button 
              onClick={startCamera}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Tentar Novamente
            </button>
          </div>
        ) : (
          <div className="relative aspect-[3/4] sm:aspect-video w-full bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-6 inset-x-0 flex justify-center">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all p-1"
              >
                <div className="w-full h-full bg-white rounded-full border-2 border-slate-900" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
