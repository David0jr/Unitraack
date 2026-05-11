import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAuthToken } from '../../../utils/subdomain';
import { Truck, Search, CheckCircle, Loader2, Package, Hash, Info, LogOut, Eye, AlertTriangle, X, Camera, ShieldAlert, ChevronRight, MapPin, ShieldCheck, ClipboardList, History, Users, Calendar, Clock } from 'lucide-react';
import { SignaturePad } from '../../../components/SignaturePad';
import { MobileNav } from '../components/dashboard/MobileNav';

interface Material {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
  condition: string;
  code?: string;
  image_url?: string;
  status: 'PENDING' | 'IN_PLANTA' | 'OUT_PLANTA';
  photos?: string[];
}

interface Requisicao {
  id: string;
  tenant_id: string;
  sector: string;
  entry_date: string;
  created_at: string;
  status: string;
  driver_name?: string;
  plate?: string;
  profile: {
    full_name: string;
    theme_color?: string;
    representative_name?: string;
    phone?: string;
    cnpj?: string;
    logo_url?: string;
  };
  materials: Material[];
}

interface CompanyDetails {
  id: string;
  full_name: string;
  representative_name?: string;
  phone?: string;
  cnpj?: string;
  logo_url?: string;
  theme_color?: string;
}

const portariaNavItems = [
  { id: 'list', label: 'Fila', icon: <Truck /> },
  { id: 'details', label: 'Operação', icon: <ClipboardList /> },
  { id: 'history', label: 'Histórico', icon: <History /> }
];

export default function PortariaDashboard() {
  const { signOut, profile: userProfile } = useAuth();
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [detailMaterial, setDetailMaterial] = useState<Material | null>(null);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [mobileSection, setMobileSection] = useState<'list' | 'details' | 'history'>('list');
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });
  const [signature, setSignature] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: 'N/A', time: 'N/A' };
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('pt-BR'),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return { date: 'Data Inválida', time: '--:--' };
    }
  };

  const fetchAuditHistory = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/audit/${id}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const payload = await response.json();
      if (response.ok) setAuditHistory(payload.data || []);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchAuditHistory(selectedCompany.id);
    } else if (mobileSection === 'history' && userProfile?.tenant_id) {
      fetchAuditHistory(userProfile.tenant_id);
    }
  }, [selectedCompany, mobileSection]);

  const fetchRequisicoes = async () => {
    try {
      setLoading(true);
      // Busca tanto aprovados quanto em planta
      const statusList = activeTab === 'ENTRY' 
        ? ['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'DISCREPANCY'] 
        : ['IN_PLANTA'];
        
      const query = new URLSearchParams();
      statusList.forEach(s => query.append('status', s));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/approved?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const payload = await response.json();
      
      if (response.ok) {
        setRequisicoes(Array.isArray(payload.data) ? payload.data : []);
      } else {
        console.error('Erro na resposta da API:', payload.error);
        setRequisicoes([]);
      }
    } catch (err) {
      console.error('Erro ao carregar requisicoes:', err);
      setRequisicoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisicoes();
    setSelecionadoId(null);
    setSelectedMaterials([]);
    setPhotos([]);
  }, [activeTab]);

  const selectedReq = Array.isArray(requisicoes) ? requisicoes.find(r => r.id === selecionadoId) : null;

  useEffect(() => {
    if (selectedReq) {
      const initial = selectedReq.materials
        .filter(m => (activeTab === 'ENTRY' ? m.status !== 'IN_PLANTA' : m.status === 'IN_PLANTA'))
        .map(m => m.id);
      setSelectedMaterials(initial);
    }
  }, [selecionadoId]);

  useEffect(() => {
    if (selecionadoId) {
      setMobileSection('details');
    }
  }, [selecionadoId]);

  const handleToggleMaterial = (id: string) => {
    setSelectedMaterials(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

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

  // Real-time Camera Logic
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isCameraOpen && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      }).then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      }).catch(err => {
        console.error("Erro ao acessar câmera:", err);
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
        setIsCameraOpen(false);
      });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => [...prev, dataUrl]);
        setIsCameraOpen(false);
      }
    }
  };

  const handleConfirmMovement = async () => {    
    if (!selecionadoId || selectedMaterials.length === 0) return;
    if (!signature) {
      alert('Por favor, insira suas iniciais como assinatura digital.');
      return;
    }
    
    setProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/movimentacao/${selecionadoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          materialIds: selectedMaterials,
          type: activeTab,
          signature: signature.toUpperCase(),
          photos: photos.length > 0 ? photos : undefined
        })
      });

      if (response.ok) {
        setRequisicoes(prev => prev.filter(r => r.id !== selecionadoId));
        setSelecionadoId(null);
        setMobileSection('list');
        setPhotos([]);
        setModalConfig({
          title: activeTab === 'ENTRY' ? 'Entrada Confirmada' : 'Saída Confirmada',
          message: `O protocolo de ${activeTab === 'ENTRY' ? 'entrada' : 'saída'} foi processado com sucesso e registrado no histórico.`,
          type: 'success'
        });
        setShowSuccessModal(true);
        fetchRequisicoes();
      } else {
        setModalConfig({ title: 'Falha na Operação', message: 'Ocorreu um erro ao processar a movimentação no servidor.', type: 'error' });
        setShowSuccessModal(true);
      }
    } catch (err) {
      setModalConfig({ title: 'Erro de Conexão', message: 'Não foi possível estabelecer comunicação com o servidor de segurança.', type: 'error' });
      setShowSuccessModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleNotifyDiscrepancy = async () => {
    if (!selecionadoId || !discrepancyReason) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/divergencia/${selecionadoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ reason: discrepancyReason })
      });

      if (response.ok) {
        setRequisicoes(prev => prev.filter(r => r.id !== selecionadoId));
        setSelecionadoId(null);
        setShowDiscrepancyModal(false);
        setDiscrepancyReason('');
        setModalConfig({
          title: 'Divergência Notificada',
          message: 'O alerta foi enviado com sucesso e o protocolo está sob auditoria do Gestor de Segurança.',
          type: 'success'
        });
        setShowSuccessModal(true);
        fetchRequisicoes();
      } else {
        setModalConfig({ title: 'Erro na Notificação', message: 'Não foi possível registrar a divergência neste momento.', type: 'error' });
        setShowSuccessModal(true);
      }
    } catch (err) {
      setModalConfig({ title: 'Erro de Rede', message: 'Verifique sua conexão e tente notificar a divergência novamente.', type: 'error' });
      setShowSuccessModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const filteredReqs = Array.isArray(requisicoes) ? requisicoes.filter(r => {
    const search = (searchTerm || '').toLowerCase();
    const matchesName = (r.profile?.full_name || '').toLowerCase().includes(search);
    const matchesId = (r.id || '').toLowerCase().includes(search);
    const matchesMaterials = (r.materials || []).some(m => 
      (m.name || '').toLowerCase().includes(search) || 
      (m.code || '').toLowerCase().includes(search) ||
      (m.serial_number || '').toLowerCase().includes(search)
    );
    return matchesName || matchesId || matchesMaterials;
  }) : [];

  const portariaNavItems = [
    { id: 'list', label: 'Fila', icon: <Truck /> },
    { id: 'details', label: 'Operação', icon: <ClipboardList /> },
    { id: 'history', label: 'Histórico', icon: <History /> },
  ];


  return (
    <div className="min-h-screen bg-[#F1F5F9] font-brand antialiased text-navy selection:bg-primary/10">
      
      {/* Header Premium */}
      <nav className="h-20 bg-navy border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[60] shadow-2xl shadow-navy/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
             <img 
              src="https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png" 
              alt="Lins" 
              className="h-9 brightness-0 invert"
            />
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            <div className="hidden md:block">
              <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] leading-none block mb-0.5">Logística & Segurança</span>
              <h1 className="font-bold text-white text-xs uppercase tracking-tight">Controle de Portaria</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-4 bg-white/5 px-5 py-2 rounded-xl border border-white/10">
             <div className="text-right">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">Horário Local</p>
                <p className="text-xl font-black text-white leading-none tracking-tighter">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
             </div>
          </div>
          
          <div className="hidden sm:flex flex-col items-end border-l border-white/10 pl-8">
            <p className="text-[10px] font-black text-white uppercase tracking-tighter mb-0.5">{userProfile?.full_name || 'Agente de Portaria'}</p>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Status Operacional</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="p-3 bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all group"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-4 md:p-10 pb-28 md:pb-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Navigation & Search */}
          <div className={`lg:col-span-4 space-y-6 sticky top-28 ${mobileSection !== 'list' ? 'hidden lg:block' : ''}`}>
            
            {/* Tab Switcher Industrial */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
               <button 
                onClick={() => setActiveTab('ENTRY')}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ENTRY' ? 'bg-navy text-white shadow-xl shadow-navy/20' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                  Entrada na Planta
               </button>
               <button 
                onClick={() => setActiveTab('EXIT')}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'EXIT' ? 'bg-navy text-white shadow-xl shadow-navy/20' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                  Saída da Planta
               </button>
            </div>

            <div className="relative group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
               <input 
                type="text" 
                placeholder="BUSCAR POR EMPRESA, PLACA OU ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-xs text-navy placeholder:text-slate-300 uppercase"
               />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
               <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${activeTab === 'ENTRY' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       {activeTab === 'ENTRY' ? 'Fila de Triagem' : 'Veículos em Planta'}
                     </span>
                  </div>
                  <span className="text-[10px] font-black text-navy px-3 py-1 bg-white border border-slate-200 rounded-full">
                    {filteredReqs.length}
                  </span>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                  {loading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                       <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sincronizando Banco...</p>
                    </div>
                  ) : filteredReqs.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                          <Truck className="w-8 h-8 text-slate-200" />
                       </div>
                       <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest leading-relaxed">
                         Nenhum registro<br/>identificado na fila
                       </p>
                    </div>
                  ) : filteredReqs.map(req => (
                    <button 
                      key={req.id}
                      onClick={() => setSelecionadoId(req.id)}
                      className={`w-full p-6 text-left transition-all hover:bg-slate-50 flex items-center justify-between group relative overflow-hidden ${selecionadoId === req.id ? 'bg-primary/5' : ''}`}
                    >
                      {selecionadoId === req.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                      <div className="flex items-center gap-5">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner relative flex-shrink-0"
                          style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}
                        >
                          {req.profile.logo_url ? (
                             <img src={req.profile.logo_url} className="w-full h-full object-cover" />
                          ) : req.profile.full_name[0]}
                          
                          {req.status === 'DISCREPANCY' && (
                            <div className="absolute -top-1 -right-1 bg-rose-500 rounded-full p-1 border-2 border-white shadow-lg">
                               <AlertTriangle className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-navy text-xs uppercase leading-tight mb-1">{req.profile.full_name}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{req.sector}</span>
                             <span className="text-[10px] text-slate-200">/</span>
                             <span className="text-[9px] text-primary font-black uppercase tracking-widest">#{req.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-slate-200 transition-transform ${selecionadoId === req.id ? 'translate-x-1 text-primary' : ''}`} />
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Right Column: Detailed View */}
          <div className={`lg:col-span-8 ${mobileSection !== 'details' ? 'hidden lg:block' : ''}`}>
             {selectedReq ? (
               <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,50,160,0.06)] border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                  
                  {/* Header do Cartão */}
                  <div className="p-6 md:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-8 relative">
                      <button 
                         onClick={() => setMobileSection('list')}
                         className="md:hidden flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2"
                       >
                         <ChevronRight className="w-4 h-4 rotate-180" /> Voltar para Lista
                       </button>
                      <div className="flex items-center gap-6">
                        <div 
                          className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl relative overflow-hidden group/logo"
                          style={{ backgroundColor: selectedReq.profile.theme_color || '#0032A0' }}
                        >
                           {selectedReq.profile.logo_url ? (
                             <img src={selectedReq.profile.logo_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             selectedReq.profile.full_name[0]
                           )}
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setSelectedCompany(selectedReq.profile as any)}>
                              <Info className="w-8 h-8 text-white" />
                           </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                             <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${activeTab === 'ENTRY' ? 'bg-emerald-500 text-white' : 'bg-navy text-white'}`}>
                                {activeTab === 'ENTRY' ? 'Autorização de Entrada' : 'Controle de Saída'}
                             </span>
                          </div>
                          <h2 className="text-3xl font-black text-navy uppercase tracking-tighter leading-none mb-2">{selectedReq.profile.full_name}</h2>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protocolo de {selectedReq.sector}</span>
                             </div>
                             <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                             <span className="text-[10px] text-primary font-black uppercase tracking-widest">#{selectedReq.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <div className="text-right hidden md:block">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Registro</p>
                            <span className="text-xs font-black text-navy uppercase">Agendamento Válido</span>
                         </div>
                         <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                            <ShieldCheck className="w-6 h-6" />
                         </div>
                      </div>
                  </div>

                  {selectedReq.status === 'DISCREPANCY' && (
                    <div className="bg-rose-50 p-6 flex items-center gap-4 border-b border-rose-100">
                       <div className="p-3 bg-rose-500 rounded-xl text-white shadow-lg shadow-rose-500/20">
                          <ShieldAlert className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-rose-600 font-black uppercase text-[10px] tracking-widest mb-0.5">Divergência Detectada</p>
                          <p className="text-rose-900 font-bold text-xs">Este veículo está sob análise de segurança e sua entrada está bloqueada.</p>
                       </div>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="px-6 md:px-10 py-8 md:py-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                     <div className="space-y-8">
                        <div className="flex items-center gap-5 p-6 bg-[#F8FAFC] rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">
                              <MapPin className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destino Designado</p>
                              <p className="text-lg font-black text-navy uppercase leading-none">{selectedReq.sector}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <InfoItem label="Motorista" value={selectedReq.driver_name || 'NÃO INFORMADO'} icon={<Users className="w-5 h-5 text-slate-400" />} />
                           <InfoItem label="Placa" value={selectedReq.plate || '---'} icon={<Hash className="w-5 h-5 text-slate-400" />} />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <InfoItem label="Data Agendada" value={formatDateTime(selectedReq.entry_date).date} icon={<Calendar className="w-5 h-5 text-slate-400" />} />
                           <InfoItem label="Horário" value={formatDateTime(selectedReq.entry_date).time} icon={<Clock className="w-5 h-5 text-slate-400" />} />
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-navy uppercase tracking-widest">Itens para Conferência ({selectedMaterials.length}/{selectedReq.materials.length})</p>
                           <button 
                            onClick={() => {
                              const allIds = selectedReq.materials.map(m => m.id);
                              setSelectedMaterials(selectedMaterials.length === allIds.length ? [] : allIds);
                            }}
                            className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                           >
                              {selectedMaterials.length === selectedReq.materials.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                           </button>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                           {selectedReq.materials
                             .filter(m => activeTab === 'ENTRY' ? m.status !== 'IN_PLANTA' : m.status === 'IN_PLANTA')
                             .map(item => (
                              <button 
                                key={item.id}
                                onClick={() => handleToggleMaterial(item.id)}
                                className={`w-full group p-5 rounded-2xl border transition-all flex items-center justify-between text-left ${selectedMaterials.includes(item.id) ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                              >
                                 <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedMaterials.includes(item.id) ? 'bg-primary text-white scale-110' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'}`}>
                                       {selectedMaterials.includes(item.id) ? <CheckCircle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                    </div>
                                    <div>
                                       <p className="text-[11px] font-black text-navy uppercase leading-tight group-hover:text-primary transition-colors">{item.name}</p>
                                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.brand} {item.model}</p>
                                    </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-3">
                                    <div className="text-right">
                                       <p className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter mb-0.5">Nº de Série</p>
                                       <p className={`text-[9px] font-black uppercase ${selectedMaterials.includes(item.id) ? 'text-primary' : 'text-slate-400'}`}>
                                          {item.code || (
                                             item.serial_number ? 
                                             (item.serial_number.length > 12 ? item.serial_number.slice(0, 12) + '...' : item.serial_number) 
                                             : 'N/A'
                                          )}
                                       </p>
                                    </div>

                                    {item.photos && item.photos.length > 0 && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPhotos(item.photos);
                                        }}
                                        className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1.5"
                                      >
                                         <Camera className="w-3 h-3" />
                                         <span className="text-[8px] font-black uppercase">{item.photos.length}</span>
                                      </button>
                                    )}
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Actions Area */}
                  {activeTab === 'EXIT' && (
                    <div className="px-6 md:px-10 pb-8">
                       <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6 md:p-8">
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-3">
                                <Camera className="w-5 h-5 text-primary" />
                                <div>
                                   <p className="text-[10px] font-black text-navy uppercase tracking-widest">Evidências de Saída</p>
                                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Obrigatório 1+ fotos da carga</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                  onClick={() => setIsCameraOpen(true)}
                                  className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                   <Camera className="w-4 h-4" /> Câmera
                                </button>
                                <label className="px-4 py-2 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-2">
                                   <Package className="w-4 h-4" /> Galeria
                                   <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturePhoto} />
                                </label>
                             </div>
                          </div>

                          {photos.length > 0 && (
                             <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                {photos.map((p, i) => (
                                  <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm relative group/photo">
                                     <img src={p} className="w-full h-full object-cover" />
                                     <button 
                                       onClick={() => removePhoto(i)}
                                       className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover/photo:opacity-100 transition-all hover:scale-110"
                                     >
                                       <X className="w-3 h-3" />
                                     </button>
                                  </div>
                                ))}
                             </div>
                          )}
                       </div>
                    </div>
                  )}

                  <SignaturePad 
                     placeholder="Assinatura Digital"
                     onSave={setSignature}
                     onClear={() => setSignature('')}
                  />

                  <div className="p-6 md:p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row gap-5">
                     <button 
                        onClick={handleConfirmMovement}
                        disabled={processing || selectedMaterials.length === 0 || !signature || selectedReq.status === 'DISCREPANCY'}
                        className={`flex-[3] py-7 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl ${activeTab === 'ENTRY' ? 'bg-navy text-white shadow-navy/30 hover:bg-[#002880]' : 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700'}`}
                     >
                        {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                          <>
                             <CheckCircle className="w-6 h-6" />
                             {activeTab === 'ENTRY' ? `Liberar Entrada (${selectedMaterials.length})` : `Confirmar Saída (${selectedMaterials.length})`}
                          </>
                        )}
                     </button>
                     
                     <button 
                        onClick={() => setShowDiscrepancyModal(true)}
                        disabled={processing || selectedReq.status === 'DISCREPANCY'}
                        className="flex-1 py-7 bg-white text-rose-500 border-2 border-rose-500/10 hover:bg-rose-50 disabled:opacity-30 rounded-[2rem] font-black uppercase tracking-[0.1em] text-[10px] flex items-center justify-center gap-3 transition-all active:scale-95 group"
                     >
                        <ShieldAlert className="w-5 h-5 group-hover:animate-bounce" />
                        Divergência
                     </button>
                  </div>
               </div>
             ) : (
               <div className="h-[700px] flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border-2 border-slate-100 border-dashed relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-50/50 to-transparent"></div>
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 relative">
                     <div className="absolute inset-0 bg-slate-100 rounded-full animate-ping opacity-20"></div>
                     <Truck className="w-12 h-12 text-slate-200" />
                  </div>
                  <h3 className="text-navy font-black text-2xl uppercase tracking-tighter mb-3 relative">Central de Conferência</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] max-w-sm text-center leading-relaxed relative">
                    Selecione um veículo na fila lateral para iniciar o protocolo de {activeTab === 'ENTRY' ? 'entrada' : 'saída'}.
                  </p>
               </div>
             )}
          </div>

          {/* Mobile History View */}
          {mobileSection === 'history' && (
            <div className="lg:hidden space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div>
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter italic">
                    Histórico de <span className="text-primary not-italic">Portaria</span>
                  </h2>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-1">Registros recentes de entrada e saída.</p>
               </div>

               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {auditHistory.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                       <History className="w-10 h-10 text-slate-200" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum registro encontrado</p>
                    </div>
                  ) : auditHistory.map((audit, i) => (
                    <div key={i} className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: audit.material?.request?.profile?.theme_color || '#0032A0' }}>
                                 {audit.material?.request?.profile?.logo_url ? (
                                    <img src={audit.material?.request?.profile?.logo_url} className="w-full h-full object-cover rounded-xl" />
                                 ) : audit.material?.request?.profile?.full_name?.[0]}
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-navy uppercase leading-tight">{audit.material?.name}</p>
                                 <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">{audit.material?.request?.profile?.full_name}</p>
                              </div>
                           </div>
                           <div className="text-right shrink-0">
                              <p className="text-[10px] font-black text-navy">{new Date(audit.moved_at).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[9px] text-slate-400 font-bold">{new Date(audit.moved_at).toLocaleTimeString('pt-BR')}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md">{audit.from_sector?.name || '---'}</span>
                           <ChevronRight className="w-3 h-3 text-slate-300" />
                           <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-md">{audit.to_sector?.name || '---'}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-navy text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                                 {audit.actor?.full_name?.[0]}
                              </div>
                              <span className="text-[10px] font-black text-navy uppercase tracking-tighter">{audit.actor?.full_name}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              {audit.photos && audit.photos.length > 0 && (
                                <button onClick={() => setSelectedPhotos(audit.photos)} className="p-2.5 bg-primary/10 text-primary rounded-xl active:scale-90 transition-transform">
                                   <Camera className="w-4 h-4" />
                                </button>
                              )}
                           </div>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

        </div>
      </main>

      {/* Material Detail Modal */}
      {detailMaterial && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
              <div className="md:w-1/2 bg-slate-50 relative min-h-[400px]">
                 {detailMaterial.image_url ? (
                   <img src={detailMaterial.image_url} alt={detailMaterial.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Camera className="w-20 h-20 mb-4 opacity-20" />
                      <p className="font-bold text-[10px] uppercase tracking-widest">Sem Foto Disponível</p>
                   </div>
                 )}
                 <div className="absolute top-6 left-6">
                    <span className="bg-navy/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">Visualização Técnica</span>
                 </div>
              </div>
              <div className="md:w-1/2 p-12 flex flex-col justify-between">
                 <div>
                    <div className="flex justify-between items-start mb-8">
                       <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Equipamento</p>
                          <h2 className="text-4xl font-bold text-navy uppercase leading-none tracking-tighter">{detailMaterial.name}</h2>
                       </div>
                       <button onClick={() => setDetailMaterial(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-navy rounded-xl transition-all">
                          <X className="w-6 h-6" />
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                       <DetailItem label="Marca" value={detailMaterial.brand || '---'} />
                       <DetailItem label="Modelo" value={detailMaterial.model || '---'} />
                       <DetailItem label="Nº de Série" value={detailMaterial.serial_number || 'REGISTRO ÚNICO'} />
                       <DetailItem label="Condição" value={detailMaterial.condition || 'USADO'} />
                    </div>

                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Descrição Adicional</p>
                       <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          {detailMaterial.description || 'Nenhuma descrição detalhada fornecida para este item.'}
                       </p>
                    </div>
                 </div>

                 <button 
                  onClick={() => setDetailMaterial(null)}
                  className="w-full bg-navy text-white font-bold uppercase tracking-widest py-6 rounded-2xl mt-12 hover:bg-[#002880] transition-all"
                 >
                    Fechar Detalhes
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-amber-900/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border-4 border-amber-500/20">
              <div className="p-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-amber-500 rounded-xl">
                       <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-navy uppercase tracking-tighter">Notificar Divergência</h3>
                       <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Alerta ao Gestor de Segurança</p>
                    </div>
                 </div>

                 <div className="mb-10">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Qual a irregularidade identificada?</label>
                    <textarea 
                      value={discrepancyReason}
                      onChange={(e) => setDiscrepancyReason(e.target.value)}
                      placeholder="Ex: Material extra não listado, equipamento danificado, foto não confere..."
                      className="w-full h-40 bg-slate-50 border border-slate-100 rounded-2xl p-6 focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-bold text-sm resize-none"
                    ></textarea>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => setShowDiscrepancyModal(false)}
                      className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-navy transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleNotifyDiscrepancy}
                      disabled={!discrepancyReason || processing}
                      className="flex-[2] py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-amber-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enviar Alerta'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
             {/* Left side: Company Info */}
             <div className="p-8 md:w-1/2 border-r border-slate-100 flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-start mb-8">
                      <div 
                       className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl"
                       style={{ backgroundColor: selectedCompany.theme_color || '#0032A0' }}
                      >
                         {selectedCompany.logo_url ? (
                           <img src={selectedCompany.logo_url} alt="" className="w-full h-full object-cover" />
                         ) : (
                           selectedCompany.full_name[0]
                         )}
                      </div>
                      <button 
                       onClick={() => setSelectedCompany(null)}
                       className="p-2 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all md:hidden"
                      >
                        <X className="w-6 h-6" />
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
                </div>

                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-navy text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl mt-10 hover:bg-[#002880] transition-all shadow-xl shadow-navy/20"
                >
                  Fechar Detalhes
                </button>
             </div>

             {/* Right side: Movement History */}
             <div className="p-8 md:w-1/2 bg-slate-50 flex flex-col overflow-hidden">
                <div className="mb-6 flex items-center justify-between">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Histórico de Movimentações</h4>
                   <span className="bg-white text-navy text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                     {auditHistory.length} REGISTROS
                   </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                   {auditHistory.length === 0 ? (
                      <div className="bg-white rounded-xl p-6 text-center border border-slate-100 shadow-sm">
                         <Info className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem movimentações registradas</p>
                      </div>
                   ) : auditHistory.map((item) => (
                      <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 group hover:border-primary/20 transition-all">
                         <div className="flex justify-between items-start mb-2">
                            <div>
                               <p className="text-[10px] font-bold text-navy uppercase">{item.material.name}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                 {item.from_sector?.name || 'ENTRADA'} → {item.to_sector?.name || 'SAÍDA'}
                               </p>
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 whitespace-nowrap">
                              {formatDateTime(item.moved_at).date} {formatDateTime(item.moved_at).time}
                            </span>
                         </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                             <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                   {item.actor?.full_name?.[0]}
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                                   Ação por: <span className="text-navy">{item.actor?.full_name}</span>
                                   {item.signature && (
                                     item.signature.startsWith('data:image/') ? (
                                       <div className="ml-2 inline-block bg-white border border-slate-100 rounded p-0.5 align-middle">
                                          <img src={item.signature} alt="Visto" className="h-4 object-contain" />
                                       </div>
                                     ) : (
                                       <span className="ml-2 text-primary">[{item.signature}]</span>
                                     )
                                   )}
                                </p>
                             </div>

                             {item.photos && item.photos.length > 0 && (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSelectedPhotos(item.photos);
                                 }}
                                 className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1.5"
                               >
                                  <Camera className="w-3 h-3" />
                                  <span className="text-[8px] font-black uppercase">{item.photos.length}</span>
                               </button>
                             )}
                          </div>
                      </div>
                   ))}
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="p-10 text-center">
                 <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-lg ${modalConfig.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                    {modalConfig.type === 'success' ? (
                      <CheckCircle className="w-10 h-10 text-white" />
                    ) : (
                      <AlertTriangle className="w-10 h-10 text-white" />
                    )}
                 </div>
                 <h3 className="text-2xl font-black text-navy uppercase tracking-tighter mb-2">{modalConfig.title}</h3>
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed mb-8">{modalConfig.message}</p>
                 
                 <button 
                   onClick={() => setShowSuccessModal(false)}
                   className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl ${modalConfig.type === 'success' ? 'bg-navy text-white shadow-navy/20 hover:bg-[#002880]' : 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'}`}
                 >
                    Prosseguir
                 </button>
              </div>
           </div>
         </div>
       )}
       {selectedPhotos && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-navy/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-6xl h-full flex flex-col">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-primary rounded-2xl text-white">
                        <Camera className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Evidências Fotográficas</h3>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Protocolo de Portaria • {selectedPhotos.length} Fotos</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPhotos(null)}
                    className="p-4 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                  >
                    <X className="w-8 h-8" />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                     {selectedPhotos.map((p, i) => (
                       <div key={i} className="group relative aspect-video bg-navy-900 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                          <img src={p} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end">
                             <p className="text-[9px] font-black text-white uppercase tracking-widest">Evidência #{i + 1}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
       )}
       {isCameraOpen && (
         <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="relative w-full h-full flex flex-col">
               {/* Viewfinder */}
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 className="flex-1 w-full h-full object-cover"
               />
               
               {/* Overlay Controls */}
               <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
                  <div className="flex justify-end pointer-events-auto">
                     <button 
                       onClick={() => setIsCameraOpen(false)}
                       className="p-4 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all"
                     >
                        <X className="w-8 h-8" />
                     </button>
                  </div>
                  
                  <div className="flex justify-center items-center gap-12 pointer-events-auto pb-8">
                     <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center">
                        {/* Empty spacer for alignment */}
                     </div>
                     
                     <button 
                       onClick={takePhoto}
                       className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
                     >
                        <div className="w-20 h-20 rounded-full border-4 border-navy/10"></div>
                     </button>
                     
                     <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center">
                        {/* Future: camera switch button could go here */}
                     </div>
                  </div>
               </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
         </div>
       )}

        <MobileNav 
          activeSection={mobileSection} 
          setActiveSection={(s: any) => setMobileSection(s)} 
          items={portariaNavItems} 
        />
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
       <p className="font-bold text-navy text-sm">{value}</p>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary/5 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-navy uppercase">{value}</p>
      </div>
    </div>
  );
}
