import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTenant } from '../../../contexts/TenantContext';
import { getAuthToken } from '../../../utils/subdomain';
import { Truck, Search, CheckCircle, Loader2, Package, Hash, Info, LogOut, Eye, AlertTriangle, X, Camera, ShieldAlert, ChevronRight, MapPin, ShieldCheck, ClipboardList, History, Users, Calendar, Clock, XOctagon, ArrowRight, RotateCcw, Play } from 'lucide-react';
import { MobileNav } from '../components/dashboard/MobileNav';
import Swal from 'sweetalert2';
import { supabase } from '../../../lib/supabase';
import { WebcamModal } from '../../../components/WebcamModal';
import { PortariaHistoryView } from '../components/dashboard/PortariaHistoryView';
import { NotificationDropdown } from '../components/dashboard/NotificationDropdown';
import { compressImage } from '../../../utils/imageCompressor';

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
  status: 'PENDING' | 'IN_PLANTA' | 'OUT_PLANTA' | 'MOVING' | 'WAITING_EXIT' | 'EXIT_CONFERENCE';
  photos?: string[];
}

interface Requisicao {
  id: string;
  tenant_id: string;
  sector: string;
  entry_date: string;
  created_at: string;
  status: string;
  reason?: string;
  rejection_reason?: string;
  gate_checked_at?: string;
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
  const { tenant } = useTenant();
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'EXIT' | 'IN_PLANTA'>('ENTRY');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [detailMaterial, setDetailMaterial] = useState<Material | null>(null);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [mobileSection, setMobileSection] = useState<'list' | 'details' | 'history'>('list');
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [isHistoryPageOpen, setIsHistoryPageOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });
  const [signature, setSignature] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [observation, setObservation] = useState('');
  const [entrySubFilter, setEntrySubFilter] = useState<'WAITING' | 'ARRIVED' | 'ANALYSIS'>('WAITING');
  const [exitSubFilter, setExitSubFilter] = useState<'WAITING' | 'CONFERENCE'>('WAITING');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: 'N/A', time: 'N/A' };
    try {
      const safeDateStr = (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/)) 
        ? `${dateStr}Z` 
        : dateStr;
      const d = new Date(safeDateStr);
      return {
        date: d.toLocaleDateString('pt-BR'),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return { date: 'Data Inválida', time: '--:--' };
    }
  };

  const fetchAuditHistory = async (id?: string) => {
    const targetId = id || userProfile?.tenant_id;
    if (!targetId) return;
    try {
      setLoadingHistory(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/audit/${targetId}?onlyPortaria=true`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const payload = await response.json();
      if (response.ok) setAuditHistory(payload.data || []);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchAuditHistory(selectedCompany.id);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (isHistoryPageOpen && userProfile?.tenant_id) {
      fetchAuditHistory(userProfile.tenant_id);
    }
  }, [isHistoryPageOpen, userProfile?.tenant_id]);

  const handleUpdateGateStatus = async (targetId: string, newStatus: 'WAITING_ARRIVAL' | 'ARRIVED' | 'IN_ANALYSIS' | 'WAITING_EXIT' | 'EXIT_CONFERENCE') => {
    setProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/status/${targetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setRequisicoes(prev => prev.map(r => r.id === targetId ? { ...r, status: newStatus } : r));
        const statusLabel = 
          newStatus === 'ARRIVED' ? 'Chegada Registrada' : 
          newStatus === 'IN_ANALYSIS' ? 'Em Análise' : 
          newStatus === 'WAITING_ARRIVAL' ? 'Aguardando Chegada' :
          newStatus === 'EXIT_CONFERENCE' ? 'Conferência de Saída Iniciada' :
          newStatus === 'WAITING_EXIT' ? 'Aguardando Saída' : newStatus;
        Swal.fire({
          icon: 'success',
          title: statusLabel,
          text: `O status da solicitação foi alterado para "${statusLabel}". Notificações enviadas aos gestores e líderes.`,
          timer: 2000,
          showConfirmButton: false
        });
        fetchRequisicoes();
      } else {
        const data = await response.json();
        Swal.fire('Erro', data.error || 'Não foi possível alterar o status.', 'error');
      }
    } catch (err) {
      Swal.fire('Erro de Conexão', 'Não foi possível conectar com o servidor.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const fetchRequisicoes = async () => {
    try {
      setLoading(true);
      const statusList = activeTab === 'ENTRY' 
        ? ['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL', 'ARRIVED', 'IN_ANALYSIS', 'DISCREPANCY'] 
        : activeTab === 'EXIT'
        ? ['WAITING_EXIT', 'EXIT_CONFERENCE', 'IN_PLANTA']
        : ['IN_PLANTA', 'DISCREPANCY', 'WAITING_EXIT', 'EXIT_CONFERENCE'];
        
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
    setEntrySubFilter('WAITING');
    setExitSubFilter('WAITING');
  }, [activeTab]);

  useEffect(() => {
    const channel = supabase
      .channel('portaria_dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entry_requests' }, () => {
        console.log('[Realtime] entry_requests changed, refreshing portaria...');
        fetchRequisicoes();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'material_movements' }, () => {
        console.log('[Realtime] material_movements changed, refreshing portaria...');
        fetchRequisicoes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const selectedReq = Array.isArray(requisicoes) ? requisicoes.find(r => r.id === selecionadoId) : null;

  useEffect(() => {
    if (selectedReq) {
      const initial = selectedReq.materials
        .filter(m => (activeTab === 'ENTRY' ? m.status !== 'IN_PLANTA' : ['WAITING_EXIT', 'EXIT_CONFERENCE'].includes(m.status)))
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

  const handleConfirmMovement = async () => {    
    if (!selecionadoId || selectedMaterials.length === 0) return;
    const cleanSignature = signature.trim().toUpperCase();
    if (!cleanSignature) {
      setModalConfig({
        title: 'Matrícula Obrigatória',
        message: 'Por favor, insira o número de matrícula para autorizar a operação.',
        type: 'error'
      });
      setShowSuccessModal(true);
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
          signature: cleanSignature,
          photos: photos.length > 0 ? photos : undefined,
          observation: observation ? observation : undefined
        })
      });

      const payload = await response.json().catch(() => null);

      if (response.ok) {
        setRequisicoes(prev => prev.filter(r => r.id !== selecionadoId));
        setSelecionadoId(null);
        setMobileSection('list');
        setPhotos([]);
        setObservation('');
        setSignature('');
        setModalConfig({
          title: activeTab === 'ENTRY' ? 'Entrada Confirmada' : 'Saída Confirmada',
          message: payload?.data?.message || payload?.message || `O protocolo de ${activeTab === 'ENTRY' ? 'entrada' : 'saída'} foi processado com sucesso e registrado no histórico.`,
          type: 'success'
        });
        setShowSuccessModal(true);
        fetchRequisicoes();
      } else {
        const errorMsg = payload?.error || payload?.message || 'Matrícula inválida! A matrícula informada não foi encontrada ou não possui autorização ativa.';
        setModalConfig({ 
          title: 'Matrícula Inválida', 
          message: errorMsg, 
          type: 'error' 
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      setModalConfig({ title: 'Erro de Conexão', message: 'Não foi possível estabelecer comunicação com o servidor de segurança.', type: 'error' });
      setShowSuccessModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelEntry = async () => {
    if (!selecionadoId) return;

    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Cancelar Entrada?',
      text: 'Informe o motivo do cancelamento da entrada.',
      input: 'text',
      inputValue: 'Cancelado pela Portaria: Não compareceu na data/prazo estimado',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, Cancelar Entrada',
      cancelButtonText: 'Voltar',
      inputValidator: (value) => {
        if (!value) {
          return 'Você precisa informar o motivo!';
        }
      }
    });

    if (isConfirmed && reason) {
      setProcessing(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/cancelar/${selecionadoId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ reason })
        });

        if (response.ok) {
          setRequisicoes(prev => prev.filter(r => r.id !== selecionadoId));
          setSelecionadoId(null);
          setMobileSection('list');
          Swal.fire('Cancelado!', 'A entrada foi cancelada com sucesso.', 'success');
          fetchRequisicoes();
        } else {
          Swal.fire('Erro', 'Ocorreu um erro ao cancelar a entrada.', 'error');
        }
      } catch (err) {
        Swal.fire('Erro', 'Não foi possível comunicar com o servidor.', 'error');
      } finally {
        setProcessing(false);
      }
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
        setRequisicoes(prev => prev.map(r => r.id === selecionadoId ? { ...r, status: 'DISCREPANCY', reason: discrepancyReason } : r));
        setShowDiscrepancyModal(false);
        setDiscrepancyReason('');
        setModalConfig({
          title: 'Divergência Registrada',
          message: 'Divergência gravada com sucesso e notificada ao Gestor de Segurança. O registro fica ativo para auditoria e a entrada pode ser liberada normalmente após a conferência dos itens.',
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
    if (activeTab === 'EXIT') {
      const hasExitMaterials = r.materials?.some((m: any) => ['WAITING_EXIT', 'EXIT_CONFERENCE'].includes(m.status)) || ['WAITING_EXIT', 'EXIT_CONFERENCE'].includes(r.status);
      if (!hasExitMaterials) return false;

      const isWaitingExit = r.status === 'WAITING_EXIT' || r.materials?.some((m: any) => m.status === 'WAITING_EXIT');
      const isConference = r.status === 'EXIT_CONFERENCE' || r.materials?.some((m: any) => m.status === 'EXIT_CONFERENCE');

      if (exitSubFilter === 'WAITING' && !isWaitingExit) return false;
      if (exitSubFilter === 'CONFERENCE' && !isConference) return false;
    }
    if (activeTab === 'IN_PLANTA' && !r.materials?.some((m: any) => m.status === 'IN_PLANTA')) {
      return false;
    }
    if (activeTab === 'ENTRY') {
      if (r.status === 'DISCREPANCY' && (r.gate_checked_at || r.materials?.some((m: any) => m.status === 'IN_PLANTA'))) return false;

      const isWaiting = ['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL'].includes(r.status);
      const isArrived = r.status === 'ARRIVED';
      const isAnalysis = r.status === 'IN_ANALYSIS';
      const isDiscrepancy = r.status === 'DISCREPANCY';

      if (entrySubFilter === 'WAITING' && !isWaiting) return false;
      if (entrySubFilter === 'ARRIVED' && !isArrived) return false;
      if (entrySubFilter === 'ANALYSIS' && !(isAnalysis || isDiscrepancy)) return false;
    }
    if (activeTab === 'IN_PLANTA') {
      if (r.status === 'DISCREPANCY' && !r.gate_checked_at && !r.materials?.some((m: any) => m.status === 'IN_PLANTA')) return false;
    }
    const search = (searchTerm || '').toLowerCase();
    const matchesName = (r.profile?.full_name || '').toLowerCase().includes(search);
    const matchesId = (r.id || '').toLowerCase().includes(search);
    const matchesMaterials = (r.materials || []).some(m => 
      (m.name || '').toLowerCase().includes(search) || 
      (m.serial_number || '').toLowerCase().includes(search)
    );
    return matchesName || matchesId || matchesMaterials;
  }).sort((a, b) => {
    const dateA = a.entry_date ? new Date(a.entry_date).getTime() : 0;
    const dateB = b.entry_date ? new Date(b.entry_date).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }) : [];

  const InfoItem = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-navy uppercase">{value}</p>
      </div>
    </div>
  );

  const DetailItem = ({ label, value }: { label: string; value: string }) => (
    <div>
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-sm font-bold text-navy">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-brand antialiased text-navy selection:bg-primary/10">
      
      <nav className="h-20 bg-navy border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[60] shadow-2xl shadow-navy/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {tenant?.logo_url || userProfile?.tenant?.logo_url ? (
              <img 
                src={tenant?.logo_url || userProfile?.tenant?.logo_url} 
                alt={tenant?.name || userProfile?.tenant?.name || 'Usina'} 
                className="h-9 object-contain brightness-0 invert max-w-[160px]"
              />
            ) : (
              <span className="font-bold text-white text-xs uppercase tracking-tight">
                {tenant?.name || userProfile?.tenant?.name || 'Usina'}
              </span>
            )}
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            <div className="hidden md:block">
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
          </div>

          <NotificationDropdown />

          <button 
            onClick={() => {
              const nextState = !isHistoryPageOpen;
              setIsHistoryPageOpen(nextState);
              if (nextState && userProfile?.tenant_id) {
                fetchAuditHistory(userProfile.tenant_id);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-black text-[10px] md:text-xs uppercase tracking-wider ${
              isHistoryPageOpen 
                ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-white/20' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Histórico de Portaria"
          >
            <History className="w-4 h-4" /> Histórico
          </button>

          <button 
            onClick={signOut}
            className="p-3 bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all group"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      <main className="max-w-[1700px] mx-auto p-4 md:p-8 pb-36 lg:pb-12">
        {isHistoryPageOpen ? (
          <PortariaHistoryView 
            history={auditHistory}
            loading={loadingHistory}
            onRefresh={() => fetchAuditHistory(userProfile?.tenant_id)}
            onBack={() => {
              setIsHistoryPageOpen(false);
              setMobileSection('list');
            }}
            onViewPhotos={(p) => setSelectedPhotos(p)}
          />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className={`lg:col-span-4 space-y-6 sticky top-28 ${mobileSection !== 'list' ? 'hidden lg:block' : ''}`}>
            
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
               <button 
                onClick={() => { setActiveTab('ENTRY'); setMobileSection('list'); }}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ENTRY' ? 'bg-navy text-white shadow-xl shadow-navy/20' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                  Entrada na Planta
               </button>
               <button 
                onClick={() => { setActiveTab('EXIT'); setMobileSection('list'); }}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'EXIT' ? 'bg-navy text-white shadow-xl shadow-navy/20' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                  Saída da Planta
               </button>
               <button 
                onClick={() => { setActiveTab('IN_PLANTA'); setMobileSection('list'); }}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'IN_PLANTA' ? 'bg-navy text-white shadow-xl shadow-navy/20' : 'text-slate-400 hover:bg-slate-50'}`}
               >
                  Em Planta
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

            {activeTab === 'ENTRY' && (
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <button
                  onClick={() => setEntrySubFilter('WAITING')}
                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center ${
                    entrySubFilter === 'WAITING'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  <span>Aguardando</span>
                  <span className={`text-[8px] font-bold ${entrySubFilter === 'WAITING' ? 'text-white/80' : 'text-slate-400'}`}>
                    {requisicoes.filter(r => ['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL'].includes(r.status)).length}
                  </span>
                </button>
                <button
                  onClick={() => setEntrySubFilter('ARRIVED')}
                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center ${
                    entrySubFilter === 'ARRIVED'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <span>Chegada</span>
                  <span className={`text-[8px] font-bold ${entrySubFilter === 'ARRIVED' ? 'text-white/80' : 'text-slate-400'}`}>
                    {requisicoes.filter(r => r.status === 'ARRIVED').length}
                  </span>
                </button>
                <button
                  onClick={() => setEntrySubFilter('ANALYSIS')}
                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center ${
                    entrySubFilter === 'ANALYSIS'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <span>Em Análise</span>
                  <span className={`text-[8px] font-bold ${entrySubFilter === 'ANALYSIS' ? 'text-white/80' : 'text-slate-400'}`}>
                    {requisicoes.filter(r => r.status === 'IN_ANALYSIS' || r.status === 'DISCREPANCY').length}
                  </span>
                </button>
              </div>
            )}

            {activeTab === 'EXIT' && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <button
                  onClick={() => setExitSubFilter('WAITING')}
                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center ${
                    exitSubFilter === 'WAITING'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <span>Aguardando Saída</span>
                  <span className={`text-[8px] font-bold ${exitSubFilter === 'WAITING' ? 'text-white/80' : 'text-slate-400'}`}>
                    {requisicoes.filter(r => r.status === 'WAITING_EXIT' || r.materials?.some((m: any) => m.status === 'WAITING_EXIT')).length}
                  </span>
                </button>
                <button
                  onClick={() => setExitSubFilter('CONFERENCE')}
                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center ${
                    exitSubFilter === 'CONFERENCE'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <span>Conferência</span>
                  <span className={`text-[8px] font-bold ${exitSubFilter === 'CONFERENCE' ? 'text-white/80' : 'text-slate-400'}`}>
                    {requisicoes.filter(r => r.status === 'EXIT_CONFERENCE' || r.materials?.some((m: any) => m.status === 'EXIT_CONFERENCE')).length}
                  </span>
                </button>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
               <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${activeTab === 'ENTRY' ? 'bg-emerald-500' : activeTab === 'EXIT' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       {activeTab === 'ENTRY' ? 'Fila de Triagem' : activeTab === 'EXIT' ? 'Veículos Aguardando Saída' : 'Veículos em Planta'}
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
                          
                          {(req.status === 'DISCREPANCY' || Boolean(req.rejection_reason || req.reason)) && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-white shadow-lg" title="Remessa com divergência / observação">
                               <AlertTriangle className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-navy text-xs uppercase leading-tight mb-1">{req.profile.full_name}</p>
                          <div className="flex items-center gap-2 mb-1.5">
                             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{req.sector}</span>
                             <span className="text-[10px] text-slate-200">/</span>
                             <span className="text-[9px] text-primary font-black uppercase tracking-widest">#{req.id.slice(0, 8)}</span>
                          </div>
                          {activeTab === 'ENTRY' && (
                            <div>
                              {req.status === 'DISCREPANCY' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Divergência
                                </span>
                              )}
                              {req.status === 'ARRIVED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Truck className="w-2.5 h-2.5" /> Chegada
                                </span>
                              )}
                              {req.status === 'IN_ANALYSIS' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                  <Search className="w-2.5 h-2.5" /> Em Análise
                                </span>
                              )}
                              {['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL'].includes(req.status) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                                  <Clock className="w-2.5 h-2.5" /> Aguardando Chegada
                                </span>
                              )}
                            </div>
                          )}
                          {activeTab === 'IN_PLANTA' && (
                            <div>
                              {(req.status === 'DISCREPANCY' || Boolean(req.rejection_reason || req.reason)) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Com Divergência
                                </span>
                              )}
                            </div>
                          )}
                          {activeTab === 'EXIT' && (
                            <div>
                              {(req.status === 'EXIT_CONFERENCE' || req.materials?.some((m: any) => m.status === 'EXIT_CONFERENCE')) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                  <ClipboardList className="w-2.5 h-2.5" /> Conferência
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-2.5 h-2.5" /> Aguardando Saída
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-slate-200 transition-transform ${selecionadoId === req.id ? 'translate-x-1 text-primary' : ''}`} />
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className={`lg:col-span-8 ${mobileSection !== 'details' ? 'hidden lg:block' : ''}`}>
             {selectedReq ? (
               <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,50,160,0.06)] border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                  
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
                          <h2 className="text-3xl font-black text-navy uppercase tracking-tighter leading-none mb-2">{selectedReq.profile.full_name}</h2>
                        </div>
                      </div>
                  </div>

                  {activeTab === 'ENTRY' && (
                    <div className="bg-slate-50/80 border-b border-slate-200/80 p-6 md:px-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fluxo de Entrada na Usina</p>
                          <div className="flex items-center gap-2">
                            {selectedReq.status === 'ARRIVED' && (
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Truck className="w-4 h-4 text-indigo-600" /> Veículo no Portão (Chegada)
                              </span>
                            )}
                            {(selectedReq.status === 'IN_ANALYSIS' || selectedReq.status === 'DISCREPANCY') && (
                              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Search className="w-3.5 h-3.5 text-amber-600" /> Em Análise de Entrada
                              </span>
                            )}
                            {['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL'].includes(selectedReq.status) && (
                              <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-sky-600" /> Aguardando Chegada no Portão
                              </span>
                            )}
                            {selectedReq.status === 'IN_PLANTA' && (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Em Planta Industrial
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação Rápida de Status */}
                        <div className="flex flex-wrap items-center gap-2">
                          {['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL'].includes(selectedReq.status) && (
                            <>
                              <button
                                onClick={() => handleUpdateGateStatus(selectedReq.id, 'ARRIVED')}
                                disabled={processing}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" /> Registrar Chegada
                              </button>
                            </>
                          )}

                          {selectedReq.status === 'ARRIVED' && (
                            <>
                              <button
                                onClick={() => handleUpdateGateStatus(selectedReq.id, 'IN_ANALYSIS')}
                                disabled={processing}
                                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5" /> Iniciar Análise
                              </button>
                              <button
                                onClick={() => handleUpdateGateStatus(selectedReq.id, 'WAITING_ARRIVAL')}
                                disabled={processing}
                                className="px-3 py-2 bg-white border border-slate-200 text-slate-500 hover:text-navy rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Voltar para Aguardando Chegada"
                              >
                                <RotateCcw className="w-3 h-3" /> Desfazer
                              </button>
                            </>
                          )}

                          {(selectedReq.status === 'IN_ANALYSIS' || selectedReq.status === 'DISCREPANCY') && (
                            <button
                              onClick={() => handleUpdateGateStatus(selectedReq.id, 'ARRIVED')}
                              disabled={processing}
                              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-500 hover:text-navy rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                              title="Voltar para Chegada"
                            >
                              <RotateCcw className="w-3 h-3" /> Voltar p/ Chegada
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stepper Visual de 4 Fases */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                        {/* 1. Aguardando Chegada */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                          ['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL', 'ARRIVED', 'IN_ANALYSIS', 'DISCREPANCY', 'IN_PLANTA'].includes(selectedReq.status)
                            ? 'bg-white border-slate-200 text-navy font-semibold'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Fase 1</span>
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                          </div>
                          <p className="text-[11px] font-bold uppercase leading-tight">Aguardando Chegada</p>
                        </div>

                        {/* 2. Chegada */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                          ['ARRIVED', 'IN_ANALYSIS', 'DISCREPANCY', 'IN_PLANTA'].includes(selectedReq.status)
                            ? 'bg-white border-slate-200 text-navy font-semibold'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Fase 2</span>
                            <Truck className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <p className="text-[11px] font-bold uppercase leading-tight">Chegada</p>
                        </div>

                        {/* 3. Em Análise */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                          ['IN_ANALYSIS', 'DISCREPANCY', 'IN_PLANTA'].includes(selectedReq.status)
                            ? 'bg-amber-50/50 border-amber-200 text-amber-900 font-bold'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-amber-700">Fase 3</span>
                            <Search className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <p className="text-[11px] font-bold uppercase leading-tight">Em Análise</p>
                        </div>

                        {/* 4. Em Planta */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                          selectedReq.status === 'IN_PLANTA'
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-bold'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Fase 4</span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <p className="text-[11px] font-bold uppercase leading-tight">Em Planta</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'EXIT' && (
                    <div className="bg-slate-50/80 border-b border-slate-200/80 p-6 md:px-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fluxo de Saída da Usina</p>
                          <div className="flex items-center gap-2">
                            {(selectedReq.status === 'EXIT_CONFERENCE' || selectedReq.materials?.some(m => m.status === 'EXIT_CONFERENCE')) ? (
                              <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <ClipboardList className="w-4 h-4 text-purple-600" /> Em Conferência de Saída
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                <Clock className="w-4 h-4 text-amber-600" /> Aguardando Saída na Portaria
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação Rápida de Saída */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          {!(selectedReq.status === 'EXIT_CONFERENCE' || selectedReq.materials?.some(m => m.status === 'EXIT_CONFERENCE')) ? (
                            <button
                              onClick={() => handleUpdateGateStatus(selectedReq.id, 'EXIT_CONFERENCE')}
                              disabled={processing}
                              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 active:scale-95 disabled:opacity-50 animate-pulse hover:animate-none"
                            >
                              <ClipboardList className="w-4 h-4" /> Iniciar Conferência de Saída
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-purple-700 bg-purple-100/60 border border-purple-200 px-3.5 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5">
                                <ClipboardList className="w-3.5 h-3.5" /> Conferindo Itens Abaixo
                              </span>
                              <button
                                onClick={() => handleUpdateGateStatus(selectedReq.id, 'WAITING_EXIT')}
                                disabled={processing}
                                className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-navy rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                                title="Voltar para Aguardando Saída"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Voltar p/ Aguardando
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stepper Visual de Saída: 1. Aguardando Saída -> 2. Conferência -> 3. Saiu */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {/* 1. Aguardando Saída */}
                        <div className={`p-3 rounded-2xl border flex flex-col gap-1 transition-all ${
                          ['WAITING_EXIT', 'EXIT_CONFERENCE', 'COMPLETED', 'OUT_PLANTA'].includes(selectedReq.status) || selectedReq.materials?.some(m => ['WAITING_EXIT', 'EXIT_CONFERENCE'].includes(m.status))
                            ? 'bg-amber-50/80 border-amber-200 text-amber-800 font-bold ring-2 ring-amber-500/20'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Fase 1</span>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <p className="text-[11px] font-black uppercase leading-tight">Aguardando Saída</p>
                        </div>

                        {/* 2. Conferência */}
                        <div className={`p-3 rounded-2xl border flex flex-col gap-1 transition-all ${
                          selectedReq.status === 'EXIT_CONFERENCE' || selectedReq.materials?.some(m => m.status === 'EXIT_CONFERENCE')
                            ? 'bg-purple-50/80 border-purple-200 text-purple-800 font-bold ring-2 ring-purple-500/20'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Fase 2</span>
                            <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <p className="text-[11px] font-black uppercase leading-tight">Conferência</p>
                        </div>

                        {/* 3. Saiu */}
                        <div className={`p-3 rounded-2xl border flex flex-col gap-1 transition-all ${
                          selectedReq.status === 'COMPLETED' || selectedReq.materials?.every(m => m.status === 'OUT_PLANTA')
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 font-bold ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Fase 3</span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <p className="text-[11px] font-black uppercase leading-tight">Saiu da Usina</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason)) && (
                    <div className="bg-amber-50 border-b border-amber-200/80 px-6 md:px-10 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-amber-950 uppercase tracking-wider text-[11px]">
                              {selectedReq.status === 'DISCREPANCY' ? 'Divergência Registrada' : 'Remessa com Observação / Divergência'}
                            </span>
                            <span className="text-[8px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                              Atenção Portaria
                            </span>
                          </div>
                          <p className="text-amber-900 font-semibold mt-1 leading-relaxed text-xs">
                            {selectedReq.rejection_reason || selectedReq.reason || 'Divergência apontada durante a inspeção física dos equipamentos.'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-amber-800 bg-amber-100/90 px-3 py-1.5 rounded-xl shrink-0 border border-amber-200 shadow-sm">
                        Gestor Notificado
                      </span>
                    </div>
                  )}

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
                        {(() => {
                           const visibleMaterials = selectedReq.materials.filter((m: any) => 
                             activeTab === 'ENTRY' ? m.status !== 'IN_PLANTA' : 
                             activeTab === 'EXIT' ? ['WAITING_EXIT', 'EXIT_CONFERENCE'].includes(m.status) : 
                             m.status === 'IN_PLANTA'
                           );
                           return (
                             <>
                               <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-black text-navy uppercase tracking-widest">
                                    {activeTab === 'IN_PLANTA' 
                                      ? `Equipamentos em Planta (${visibleMaterials.length})` 
                                      : `Itens para Conferência (${selectedMaterials.length}/${visibleMaterials.length})`
                                    }
                                  </p>
                                  {activeTab !== 'IN_PLANTA' && (
                                    <button 
                                     onClick={() => {
                                       const allIds = visibleMaterials.map((m: any) => m.id);
                                       setSelectedMaterials(selectedMaterials.length === allIds.length ? [] : allIds);
                                     }}
                                     className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                                    >
                                       {selectedMaterials.length === visibleMaterials.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                                    </button>
                                  )}
                               </div>
                               
                               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                  {visibleMaterials.map((item: any) => (
                                    activeTab === 'IN_PLANTA' ? (
                                      <div 
                                        key={item.id}
                                        className="w-full p-4 rounded-2xl border border-slate-100 bg-white flex items-center justify-between text-left"
                                      >
                                         <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                                               <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                               <p className="text-[11px] font-black text-navy uppercase leading-tight">{item.name}</p>
                                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.brand} {item.model}</p>
                                            </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-3">
                                            <div className="text-right">
                                               <p className="text-[8px] text-slate-300 font-bold uppercase tracking-tighter mb-0.5">Nº de Série</p>
                                               <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">
                                                  {item.serial_number || 'N/A'}
                                               </p>
                                            </div>

                                            {(() => {
                                              const itemPhotos = (item.photos && item.photos.length > 0) ? item.photos : (item.image_url ? [item.image_url] : []);
                                              if (itemPhotos.length === 0) return null;
                                              return (
                                                <button 
                                                  type="button"
                                                  onClick={() => setSelectedPhotos(itemPhotos)}
                                                  className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                                  title="Visualizar fotos do item"
                                                >
                                                   <Camera className="w-3 h-3" />
                                                   <span className="text-[8px] font-black uppercase">{itemPhotos.length}</span>
                                                </button>
                                              );
                                            })()}

                                            <button
                                               onClick={() => setDetailMaterial(item)}
                                               className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-primary hover:text-white transition-all cursor-pointer"
                                               title="Visualizar Detalhes"
                                            >
                                               <Eye className="w-4 h-4" />
                                            </button>
                                         </div>
                                      </div>
                                    ) : (
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
                                                  {item.serial_number ? 
                                                     (item.serial_number.length > 12 ? item.serial_number.slice(0, 12) + '...' : item.serial_number) 
                                                     : 'N/A'
                                                  }
                                               </p>
                                            </div>

                                            {(() => {
                                              const itemPhotos = (item.photos && item.photos.length > 0) ? item.photos : (item.image_url ? [item.image_url] : []);
                                              if (itemPhotos.length === 0) return null;
                                              return (
                                                <button 
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPhotos(itemPhotos);
                                                  }}
                                                  className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                                  title="Visualizar fotos do item"
                                                >
                                                   <Camera className="w-3 h-3" />
                                                   <span className="text-[8px] font-black uppercase">{itemPhotos.length}</span>
                                                </button>
                                              );
                                            })()}

                                            <button
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 setDetailMaterial(item);
                                               }}
                                               className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-primary hover:text-white transition-all"
                                               title="Visualizar Detalhes"
                                            >
                                               <Eye className="w-4 h-4" />
                                            </button>
                                         </div>
                                      </button>
                                    )
                                  ))}
                               </div>
                             </>
                           );
                        })()}
                     </div>
                  </div>

                  {activeTab !== 'IN_PLANTA' && (
                    <div className="px-6 md:px-10 pb-8">
                       <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6 md:p-8">
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-3">
                                <Camera className="w-5 h-5 text-primary" />
                                <div>
                                   <p className="text-[10px] font-black text-navy uppercase tracking-widest">Fotos da Operação</p>
                                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                     {activeTab === 'ENTRY' ? 'Fotos do veículo, placa, caçamba, equipamentos ou inspeção' : 'Opcional para saída'}
                                   </p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setIsCameraOpen(true)}
                                  className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer"
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
                                       type="button"
                                       onClick={() => removePhoto(i)}
                                       className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover/photo:opacity-100 transition-all hover:scale-110 cursor-pointer"
                                     >
                                       <X className="w-3 h-3" />
                                     </button>
                                  </div>
                                ))}
                             </div>
                          )}

                          <div className="group mt-4">
                             <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 ml-1 block transition-colors group-focus-within:text-primary">
                               {activeTab === 'ENTRY' ? 'Observação / Estado do Veículo e Equipamento' : 'Observação da Evidência de Saída'}
                             </label>
                             <textarea 
                               placeholder={activeTab === 'ENTRY' 
                                 ? "Descreva o estado do veículo/equipamento (ex: veículo com amassado no para-choque, placa conferida, caçamba limpa)..." 
                                 : "Descreva o estado do equipamento na saída (ex: equipamento em perfeito estado, liberado com o motorista)..."}
                               value={observation}
                               onChange={(e) => setObservation(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-navy focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none shadow-sm min-h-[80px] custom-scrollbar"
                             />
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab !== 'IN_PLANTA' && (
                    <div className="px-6 md:px-10 pb-6">
                      <div className="bg-slate-50/50 rounded-3xl border border-slate-200 p-6 md:p-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-navy text-white rounded-xl shadow-lg shadow-navy/20">
                              <Hash className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-navy uppercase tracking-widest">Matrícula de Confirmação</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Digite seu código de matrícula cadastrado para validar no banco</p>
                            </div>
                          </div>
                          {userProfile?.registration_number && (
                            <button
                              type="button"
                              onClick={() => setSignature(userProfile.registration_number || '')}
                              className="text-[9px] font-black text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all"
                              title="Preencher com minha matrícula"
                            >
                              Minha Matrícula: {userProfile.registration_number}
                            </button>
                          )}
                        </div>
                        <input 
                          type="text" 
                          placeholder="DIGITE O CÓDIGO DA SUA MATRÍCULA..."
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-navy placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-black text-sm tracking-widest uppercase"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab !== 'IN_PLANTA' && (
                    <div className="p-6 md:p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row gap-5">
                       <button 
                          onClick={handleConfirmMovement}
                          disabled={processing || selectedMaterials.length === 0 || !signature}
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
                  )}
                  {activeTab === 'ENTRY' && (
                     <div className="px-6 md:px-10 pb-10 flex">
                        <button 
                           onClick={handleCancelEntry}
                           disabled={processing || selectedReq.status === 'DISCREPANCY'}
                           className="flex-1 py-5 bg-white text-rose-500 border-2 border-rose-500 hover:bg-rose-50 disabled:opacity-30 rounded-[2rem] font-black uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                           <XOctagon className="w-5 h-5" />
                           Não Compareceu / Cancelar Entrada
                        </button>
                     </div>
                  )}

                  {activeTab === 'IN_PLANTA' && (
                     <div className={`p-6 md:p-8 border-t flex items-center gap-4 rounded-b-[2.5rem] ${
                       (selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason))
                         ? 'bg-amber-50/80 border-amber-200'
                         : 'bg-slate-50/70 border-slate-100'
                     }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          (selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason))
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-primary/10 text-primary'
                        }`}>
                           {(selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason)) ? (
                             <AlertTriangle className="w-6 h-6" />
                           ) : (
                             <CheckCircle className="w-6 h-6" />
                           )}
                        </div>
                        <div>
                           <p className="text-xs font-black text-navy uppercase tracking-wider">
                             {(selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason)) 
                               ? 'Veículo & Materiais em Operação na Planta (Com Divergência Registrada)' 
                               : 'Veículo & Materiais em Operação na Planta'}
                           </p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              Destino designado: <span className="text-navy">{selectedReq.sector || 'Unidade Lins'}</span>. Nenhuma ação operacional pendente na portaria.
                           </p>
                        </div>
                     </div>
                  )}
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
                    Selecione um veículo na fila lateral para {activeTab === 'IN_PLANTA' ? 'visualizar a operação' : `iniciar o protocolo de ${activeTab === 'ENTRY' ? 'entrada' : 'saída'}`}.
                  </p>
               </div>
             )}
          </div>

        </div>
        )}
      </main>

      {/* Material Detail Modal */}
      {detailMaterial && (
        <div 
          onClick={() => setDetailMaterial(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-navy/80 backdrop-blur-xl animate-in fade-in duration-300 cursor-pointer overflow-y-auto"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-white w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] md:max-h-[85vh] my-auto rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200 cursor-default border border-slate-100"
           >
              <div className="md:w-1/2 bg-slate-50 relative h-56 sm:h-72 md:h-auto md:min-h-[350px] shrink-0">
                 {detailMaterial.image_url ? (
                   <img src={detailMaterial.image_url} alt={detailMaterial.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center text-slate-300">
                      <Camera className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 opacity-20" />
                      <p className="font-bold text-[10px] uppercase tracking-widest">Sem Foto Disponível</p>
                   </div>
                 )}
                 <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                    <span className="bg-navy/80 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-md">Visualização Técnica</span>
                 </div>
              </div>
              <div className="md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto">
                 <div>
                    <div className="flex justify-between items-start mb-6 sm:mb-8 gap-4">
                       <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 sm:mb-2">Equipamento</p>
                          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy uppercase leading-tight tracking-tighter">{detailMaterial.name}</h2>
                       </div>
                       <button onClick={() => setDetailMaterial(null)} className="p-2.5 sm:p-3 bg-slate-50 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all shrink-0 cursor-pointer">
                          <X className="w-5 h-5 sm:w-6 sm:h-6" />
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
                       <DetailItem label="Marca" value={detailMaterial.brand || '---'} />
                       <DetailItem label="Modelo" value={detailMaterial.model || '---'} />
                       <DetailItem label="Nº de Série" value={detailMaterial.serial_number || 'REGISTRO ÚNICO'} />
                       <DetailItem label="Condição" value={detailMaterial.condition || 'USADO'} />
                    </div>

                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Descrição Adicional</p>
                       <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                          {detailMaterial.description || 'Nenhuma descrição detalhada fornecida para este item.'}
                       </p>
                    </div>
                 </div>

                 <button 
                  onClick={() => setDetailMaterial(null)}
                  className="w-full bg-navy text-white font-bold uppercase tracking-widest py-4 sm:py-5 rounded-2xl mt-6 sm:mt-8 hover:bg-[#002880] transition-all text-xs shadow-lg shadow-navy/10 active:scale-[0.99] cursor-pointer shrink-0"
                 >
                    Fechar Detalhes
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && (
        <div 
          onClick={() => setShowDiscrepancyModal(false)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-amber-900/40 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border-4 border-amber-500/20 cursor-default"
           >
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
        <div 
          onClick={() => setSelectedCompany(null)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col md:flex-row max-h-[90vh] cursor-default"
          >
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
                                   setSelectedPhotos(item.photos ?? null);
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
        <div 
          onClick={() => setShowSuccessModal(false)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 cursor-default"
           >
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
          <div 
            onClick={() => setSelectedPhotos(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-navy/95 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
          >
             <div 
               onClick={(e) => e.stopPropagation()}
               className="w-full max-w-6xl h-full flex flex-col cursor-default"
             >
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
          <WebcamModal 
            onClose={() => setIsCameraOpen(false)}
            onCapture={(imageSrc) => {
              setPhotos(prev => [...prev, imageSrc]);
              setIsCameraOpen(false);
            }}
          />
        )}

        <MobileNav 
          activeSection={isHistoryPageOpen ? 'history' : mobileSection} 
          setActiveSection={(s: any) => {
            if (s === 'history') {
              setIsHistoryPageOpen(true);
              if (userProfile?.tenant_id) fetchAuditHistory(userProfile.tenant_id);
            } else {
              setIsHistoryPageOpen(false);
              setMobileSection(s);
            }
          }} 
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
