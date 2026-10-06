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

  // Polling a cada 30s para atualizar automaticamente chegadas agendadas e sincronizar fila
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequisicoes();
    }, 30000);
    return () => clearInterval(interval);
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

    // Se houver divergência apontada, confirmação explícita antes de liberar
    if (activeTab === 'ENTRY' && selectedReq?.status === 'DISCREPANCY') {
      const discReason = selectedReq.rejection_reason || (selectedReq as any).reason || 'Divergência apontada na conferência de itens';
      const result = await Swal.fire({
        title: 'Liberar com Divergência?',
        text: `Esta solicitação possui uma divergência registrada ("${discReason}"). Deseja realmente autorizar a entrada do veículo e materiais na planta?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, Liberar Entrada',
        cancelButtonText: 'Voltar e Revisar'
      });
      if (!result.isConfirmed) return;
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

    const defaultCancelReason = selectedReq?.status === 'DISCREPANCY'
      ? `Cancelado pela Portaria devido a divergência: ${selectedReq.rejection_reason || (selectedReq as any).reason || 'Itens em desacordo'}`
      : 'Cancelado pela Portaria: Não compareceu na data/prazo estimado';

    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Cancelar Entrada?',
      text: selectedReq?.status === 'DISCREPANCY'
        ? 'Confirme o cancelamento e recusa da entrada para esta solicitação com divergência.'
        : 'Informe o motivo do cancelamento da entrada.',
      input: 'text',
      inputValue: defaultCancelReason,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: selectedReq?.status === 'DISCREPANCY' ? 'Sim, Cancelar Entrada' : 'Sim, Cancelar Entrada',
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

        const payload = await response.json().catch(() => null);

        if (response.ok) {
          setRequisicoes(prev => prev.filter(r => r.id !== selecionadoId));
          setSelecionadoId(null);
          setMobileSection('list');
          Swal.fire('Cancelado!', 'A entrada foi cancelada com sucesso.', 'success');
          fetchRequisicoes();
        } else {
          Swal.fire('Erro', payload?.error || payload?.message || 'Ocorreu um erro ao cancelar a entrada.', 'error');
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
      
      <nav className="h-16 bg-navy border-b border-white/10 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[60] shadow-sm select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {tenant?.logo_url || userProfile?.tenant?.logo_url ? (
              <img 
                src={tenant?.logo_url || userProfile?.tenant?.logo_url} 
                alt={tenant?.name || userProfile?.tenant?.name || 'Usina'} 
                className="h-7 object-contain brightness-0 invert max-w-[150px]"
              />
            ) : (
              <span className="font-semibold text-white text-sm tracking-tight">
                {tenant?.name || userProfile?.tenant?.name || 'Usina Lins'}
              </span>
            )}
            <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block"></div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-white text-xs tracking-tight">Controle de Portaria</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
             <Clock className="w-3.5 h-3.5 text-primary" />
             <span className="text-xs font-medium text-slate-300 font-mono">
               {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
             </span>
          </div>
          
          <div className="hidden sm:flex flex-col items-end border-l border-white/10 pl-4">
            <p className="text-xs font-medium text-white">{userProfile?.full_name || 'Agente de Portaria'}</p>
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              isHistoryPageOpen 
                ? 'bg-primary text-white shadow-xs' 
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
            title="Histórico de Portaria"
          >
            <History className="w-3.5 h-3.5" /> <span>Histórico</span>
          </button>

          <button 
            onClick={signOut}
            className="p-2 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Sair do Sistema"
          >
            <LogOut className="w-4 h-4" />
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
          
          <div className={`lg:col-span-4 space-y-4 sticky top-24 ${mobileSection !== 'list' ? 'hidden lg:block' : ''}`}>
            
            <div className="bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex gap-1.5">
               <button 
                onClick={() => { setActiveTab('ENTRY'); setMobileSection('list'); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'ENTRY' 
                    ? 'bg-white text-navy font-semibold shadow-xs border border-slate-200/70' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
               >
                  Entrada na Planta
               </button>
               <button 
                onClick={() => { setActiveTab('EXIT'); setMobileSection('list'); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'EXIT' 
                    ? 'bg-white text-navy font-semibold shadow-xs border border-slate-200/70' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
               >
                  Saída da Planta
               </button>
               <button 
                onClick={() => { setActiveTab('IN_PLANTA'); setMobileSection('list'); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'IN_PLANTA' 
                    ? 'bg-white text-navy font-semibold shadow-xs border border-slate-200/70' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
               >
                  Em Planta
               </button>
            </div>

            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
               <input 
                type="text" 
                placeholder="Buscar por empresa, placa ou protocolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-normal text-xs text-slate-800 placeholder:text-slate-400"
               />
            </div>

            {activeTab === 'ENTRY' && (
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/70 border border-slate-200/80 rounded-xl">
                <button
                  onClick={() => setEntrySubFilter('WAITING')}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    entrySubFilter === 'WAITING'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Aguardando</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    entrySubFilter === 'WAITING' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    {requisicoes.filter(r => ['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL'].includes(r.status)).length}
                  </span>
                </button>
                <button
                  onClick={() => setEntrySubFilter('ARRIVED')}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    entrySubFilter === 'ARRIVED'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Chegada</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    entrySubFilter === 'ARRIVED' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    {requisicoes.filter(r => r.status === 'ARRIVED').length}
                  </span>
                </button>
                <button
                  onClick={() => setEntrySubFilter('ANALYSIS')}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    entrySubFilter === 'ANALYSIS'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Em Análise</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    entrySubFilter === 'ANALYSIS' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    {requisicoes.filter(r => r.status === 'IN_ANALYSIS' || r.status === 'DISCREPANCY').length}
                  </span>
                </button>
              </div>
            )}

            {activeTab === 'EXIT' && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/70 border border-slate-200/80 rounded-xl">
                <button
                  onClick={() => setExitSubFilter('WAITING')}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    exitSubFilter === 'WAITING'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Aguardando Saída</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    exitSubFilter === 'WAITING' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    {requisicoes.filter(r => r.status === 'WAITING_EXIT' || r.materials?.some((m: any) => m.status === 'WAITING_EXIT')).length}
                  </span>
                </button>
                <button
                  onClick={() => setExitSubFilter('CONFERENCE')}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    exitSubFilter === 'CONFERENCE'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Conferência</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    exitSubFilter === 'CONFERENCE' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    {requisicoes.filter(r => r.status === 'EXIT_CONFERENCE' || r.materials?.some((m: any) => m.status === 'EXIT_CONFERENCE')).length}
                  </span>
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col min-h-[500px]">
               <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                     <div className={`w-2 h-2 rounded-full ${activeTab === 'ENTRY' ? 'bg-emerald-500' : activeTab === 'EXIT' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                     <span className="text-xs font-semibold text-slate-700">
                       {activeTab === 'ENTRY' ? 'Fila de Triagem' : activeTab === 'EXIT' ? 'Veículos Aguardando Saída' : 'Veículos em Planta'}
                     </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 px-2.5 py-0.5 bg-white border border-slate-200 rounded-full shadow-xs">
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
                      className={`w-full p-4 text-left transition-all hover:bg-slate-50/80 flex items-center justify-between group relative overflow-hidden ${selecionadoId === req.id ? 'bg-primary/[0.04]' : ''}`}
                    >
                      {selecionadoId === req.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs relative shrink-0"
                          style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}
                        >
                          {req.profile.logo_url ? (
                             <img src={req.profile.logo_url} className="w-full h-full object-cover rounded-xl" />
                          ) : req.profile.full_name[0]}
                          
                          {(req.status === 'DISCREPANCY' || Boolean(req.rejection_reason || req.reason)) && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-white shadow-xs" title="Remessa com divergência / observação">
                               <AlertTriangle className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 text-xs truncate mb-0.5">{req.profile.full_name}</p>
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                             <span className="truncate">{req.sector}</span>
                             <span className="text-slate-300">•</span>
                             <span className="font-medium text-primary shrink-0">#{req.id.slice(0, 8)}</span>
                          </div>
                          {activeTab === 'ENTRY' && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {req.status === 'DISCREPANCY' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Divergência
                                </span>
                              )}
                              {req.status === 'ARRIVED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Truck className="w-2.5 h-2.5" /> Chegada
                                </span>
                              )}
                              {req.status === 'IN_ANALYSIS' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Search className="w-2.5 h-2.5" /> Em Análise
                                </span>
                              )}
                              {['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL'].includes(req.status) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                  <Clock className="w-2.5 h-2.5" /> Aguardando Chegada
                                </span>
                              )}
                            </div>
                          )}
                          {activeTab === 'IN_PLANTA' && (
                            <div>
                              {(req.status === 'DISCREPANCY' || Boolean(req.rejection_reason || req.reason)) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Com Divergência
                                </span>
                              )}
                            </div>
                          )}
                          {activeTab === 'EXIT' && (
                            <div>
                              {(req.status === 'EXIT_CONFERENCE' || req.materials?.some((m: any) => m.status === 'EXIT_CONFERENCE')) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  <ClipboardList className="w-2.5 h-2.5" /> Conferência
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-2.5 h-2.5" /> Aguardando Saída
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform shrink-0 ${selecionadoId === req.id ? 'translate-x-0.5 text-primary' : ''}`} />
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className={`lg:col-span-8 ${mobileSection !== 'details' ? 'hidden lg:block' : ''}`}>
             {selectedReq ? (
               <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  
                  <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6 relative">
                      <button 
                         onClick={() => setMobileSection('list')}
                         className="md:hidden flex items-center gap-1.5 text-slate-500 font-medium text-xs mb-2"
                       >
                         <ChevronRight className="w-4 h-4 rotate-180" /> Voltar para Lista
                       </button>
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xs relative overflow-hidden group/logo"
                          style={{ backgroundColor: selectedReq.profile.theme_color || '#0032A0' }}
                        >
                           {selectedReq.profile.logo_url ? (
                             <img src={selectedReq.profile.logo_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             selectedReq.profile.full_name[0]
                           )}
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setSelectedCompany(selectedReq.profile as any)}>
                              <Info className="w-5 h-5 text-white" />
                           </div>
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">{selectedReq.profile.full_name}</h2>
                          <p className="text-xs text-slate-500 mt-0.5 font-normal">Destino: <span className="font-medium text-slate-700">{selectedReq.sector}</span> • Protocolo #{selectedReq.id.slice(0, 8)}</p>
                        </div>
                      </div>
                  </div>

                  {activeTab === 'ENTRY' && (
                    <div className="bg-slate-50/70 border-b border-slate-200/80 p-5 md:px-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Fluxo de Entrada na Usina</p>
                          <div className="flex items-center gap-2">
                            {selectedReq.status === 'ARRIVED' && (
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                                <Truck className="w-3.5 h-3.5 text-indigo-600" /> Veículo no Portão (Chegada)
                              </span>
                            )}
                            {(selectedReq.status === 'IN_ANALYSIS' || selectedReq.status === 'DISCREPANCY') && (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                                <Search className="w-3.5 h-3.5 text-amber-600" /> Em Análise de Entrada
                              </span>
                            )}
                            {['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL'].includes(selectedReq.status) && (
                              <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                                <Clock className="w-3.5 h-3.5 text-sky-600" /> Aguardando Chegada no Portão
                              </span>
                            )}
                            {selectedReq.status === 'IN_PLANTA' && (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs">
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
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
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
                                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5" /> Iniciar Análise
                              </button>
                              <button
                                onClick={() => handleUpdateGateStatus(selectedReq.id, 'WAITING_ARRIVAL')}
                                disabled={processing}
                                className="px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
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
                              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                              title="Voltar para Chegada"
                            >
                              <RotateCcw className="w-3 h-3" /> Voltar p/ Chegada
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stepper Visual de 4 Fases */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                        {/* 1. Aguardando Chegada */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                          ['APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'WAITING_ARRIVAL', 'ARRIVED', 'IN_ANALYSIS', 'DISCREPANCY', 'IN_PLANTA'].includes(selectedReq.status)
                            ? 'bg-white border-slate-200 text-slate-800 font-semibold shadow-xs'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">Passo 1</span>
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                          </div>
                          <p className="text-xs font-semibold leading-tight">Aguardando Chegada</p>
                        </div>

                        {/* 2. Chegada */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                          ['ARRIVED', 'IN_ANALYSIS', 'DISCREPANCY', 'IN_PLANTA'].includes(selectedReq.status)
                            ? 'bg-white border-slate-200 text-slate-800 font-semibold shadow-xs'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">Passo 2</span>
                            <Truck className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <p className="text-xs font-semibold leading-tight">Chegada no Portão</p>
                        </div>

                        {/* 3. Em Análise */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                          ['IN_ANALYSIS', 'DISCREPANCY', 'IN_PLANTA'].includes(selectedReq.status)
                            ? 'bg-amber-50/60 border-amber-200 text-amber-900 font-semibold shadow-xs'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-amber-700">Passo 3</span>
                            <Search className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <p className="text-xs font-semibold leading-tight">Em Análise</p>
                        </div>

                        {/* 4. Em Planta */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                          selectedReq.status === 'IN_PLANTA'
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-semibold shadow-xs'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">Passo 4</span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <p className="text-xs font-semibold leading-tight">Em Planta</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'EXIT' && (
                    <div className="bg-slate-50/70 border-b border-slate-200/80 p-5 md:px-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Fluxo de Saída da Usina</p>
                          <div className="flex items-center gap-2">
                            {(selectedReq.status === 'EXIT_CONFERENCE' || selectedReq.materials?.some(m => m.status === 'EXIT_CONFERENCE')) ? (
                              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                                <ClipboardList className="w-3.5 h-3.5 text-purple-600" /> Em Conferência de Saída
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600" /> Aguardando Saída na Portaria
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação Rápida de Saída */}
                        <div className="flex flex-wrap items-center gap-2">
                          {!(selectedReq.status === 'EXIT_CONFERENCE' || selectedReq.materials?.some(m => m.status === 'EXIT_CONFERENCE')) ? (
                            <button
                              onClick={() => handleUpdateGateStatus(selectedReq.id, 'EXIT_CONFERENCE')}
                              disabled={processing}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                            >
                              <ClipboardList className="w-3.5 h-3.5" /> Iniciar Conferência de Saída
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                <ClipboardList className="w-3.5 h-3.5" /> Conferindo Itens Abaixo
                              </span>
                              <button
                                onClick={() => handleUpdateGateStatus(selectedReq.id, 'WAITING_EXIT')}
                                disabled={processing}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-xs"
                                title="Voltar para Aguardando Saída"
                              >
                                <RotateCcw className="w-3 h-3" /> Voltar p/ Aguardando
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stepper Visual de Saída: 1. Aguardando Saída -> 2. Conferência -> 3. Saiu */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {/* 1. Aguardando Saída */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                          ['WAITING_EXIT', 'EXIT_CONFERENCE', 'COMPLETED', 'OUT_PLANTA'].includes(selectedReq.status) || selectedReq.materials?.some(m => ['WAITING_EXIT', 'EXIT_CONFERENCE'].includes(m.status))
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">Passo 1</span>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <p className="text-xs font-semibold leading-tight">Aguardando Saída</p>
                        </div>

                        {/* 2. Conferência */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                          selectedReq.status === 'EXIT_CONFERENCE' || selectedReq.materials?.some(m => m.status === 'EXIT_CONFERENCE')
                            ? 'bg-purple-50/70 border-purple-200 text-purple-900 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">Passo 2</span>
                            <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <p className="text-xs font-semibold leading-tight">Conferência</p>
                        </div>

                        {/* 3. Saiu */}
                        <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                          selectedReq.status === 'COMPLETED' || selectedReq.materials?.every(m => m.status === 'OUT_PLANTA')
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">Passo 3</span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <p className="text-xs font-semibold leading-tight">Saiu da Usina</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason)) && (
                    <div className="bg-amber-50/70 border-b border-amber-200/80 px-6 md:px-8 py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-amber-950 text-xs">
                              {selectedReq.status === 'DISCREPANCY' ? 'Divergência Registrada' : 'Remessa com Observação / Divergência'}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                              Atenção Portaria
                            </span>
                          </div>
                          <p className="text-amber-900 font-normal mt-0.5 leading-relaxed text-xs">
                            {selectedReq.rejection_reason || selectedReq.reason || 'Divergência apontada durante a inspeção física dos equipamentos.'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-amber-800 bg-white px-2.5 py-1 rounded-lg shrink-0 border border-amber-200 shadow-xs">
                        Gestor Notificado
                      </span>
                    </div>
                  )}

                  <div className="px-6 md:px-8 py-6 md:py-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                     <div className="space-y-6">
                        <div className="flex items-center gap-4 p-5 bg-slate-50/60 rounded-xl border border-slate-200/80 group hover:border-primary/30 transition-all">
                           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-xs text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                              <MapPin className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-[11px] font-medium text-slate-500 mb-0.5">Destino Designado</p>
                              <p className="text-base font-bold text-slate-900 leading-tight">{selectedReq.sector}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <InfoItem label="Motorista" value={selectedReq.driver_name || 'NÃO INFORMADO'} icon={<Users className="w-4 h-4 text-slate-400" />} />
                           <InfoItem label="Placa" value={selectedReq.plate || '---'} icon={<Hash className="w-4 h-4 text-slate-400" />} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <InfoItem label="Data Agendada" value={formatDateTime(selectedReq.entry_date).date} icon={<Calendar className="w-4 h-4 text-slate-400" />} />
                           <InfoItem label="Horário" value={formatDateTime(selectedReq.entry_date).time} icon={<Clock className="w-4 h-4 text-slate-400" />} />
                        </div>
                     </div>

                     <div className="space-y-4">
                        {(() => {
                           const visibleMaterials = selectedReq.materials.filter((m: any) => 
                             activeTab === 'ENTRY' ? m.status !== 'IN_PLANTA' : 
                             activeTab === 'EXIT' ? ['WAITING_EXIT', 'EXIT_CONFERENCE'].includes(m.status) : 
                             m.status === 'IN_PLANTA'
                           );
                           return (
                             <>
                               <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-slate-700">
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
                                     className="text-xs font-medium text-primary hover:underline"
                                    >
                                       {selectedMaterials.length === visibleMaterials.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                                    </button>
                                  )}
                               </div>
                               
                               <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                                  {visibleMaterials.map((item: any) => (
                                    activeTab === 'IN_PLANTA' ? (
                                      <div 
                                        key={item.id}
                                        className="w-full p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-left"
                                      >
                                         <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                                               <Package className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                               <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{item.name}</p>
                                               <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.brand} {item.model}</p>
                                            </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="text-right">
                                               <p className="text-[10px] text-slate-400 font-medium">Nº Série</p>
                                               <p className="text-xs font-mono text-slate-600">
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
                                                  className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                                                  title="Visualizar fotos do item"
                                                >
                                                   <Camera className="w-3.5 h-3.5" />
                                                   <span className="text-[10px] font-bold">{itemPhotos.length}</span>
                                                </button>
                                              );
                                            })()}

                                            <button
                                               onClick={() => setDetailMaterial(item)}
                                               className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
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
                                        className={`w-full group p-3.5 rounded-xl border transition-all flex items-center justify-between text-left ${selectedMaterials.includes(item.id) ? 'bg-primary/[0.04] border-primary/30 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
                                      >
                                         <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0 ${selectedMaterials.includes(item.id) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200/70'}`}>
                                               {selectedMaterials.includes(item.id) ? <CheckCircle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                               <p className="text-xs font-semibold text-slate-800 leading-tight truncate group-hover:text-primary transition-colors">{item.name}</p>
                                               <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.brand} {item.model}</p>
                                            </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="text-right">
                                               <p className="text-[10px] text-slate-400 font-medium">Nº Série</p>
                                               <p className={`text-xs font-mono font-medium ${selectedMaterials.includes(item.id) ? 'text-primary' : 'text-slate-600'}`}>
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
                                                  className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                                                  title="Visualizar fotos do item"
                                                >
                                                   <Camera className="w-3.5 h-3.5" />
                                                   <span className="text-[10px] font-bold">{itemPhotos.length}</span>
                                                </button>
                                              );
                                            })()}

                                            <button
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 setDetailMaterial(item);
                                               }}
                                               className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-all"
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
                    <div className="px-6 md:px-8 pb-6">
                       <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-5 md:p-6">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2.5">
                                <Camera className="w-4 h-4 text-primary" />
                                <div>
                                   <p className="text-xs font-semibold text-slate-800">Fotos da Operação</p>
                                   <p className="text-[11px] text-slate-500 mt-0.5">
                                     {activeTab === 'ENTRY' ? 'Fotos do veículo, placa, caçamba, equipamentos ou inspeção' : 'Opcional para saída'}
                                   </p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setIsCameraOpen(true)}
                                  className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                   <Camera className="w-3.5 h-3.5" /> Câmera
                                </button>
                                <label className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-1.5 shadow-xs">
                                   <Package className="w-3.5 h-3.5" /> Galeria
                                   <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturePhoto} />
                                </label>
                             </div>
                          </div>

                          {photos.length > 0 && (
                             <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                                {photos.map((p, i) => (
                                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-xs relative group/photo">
                                     <img src={p} className="w-full h-full object-cover" />
                                     <button 
                                       type="button"
                                       onClick={() => removePhoto(i)}
                                       className="absolute top-1.5 right-1.5 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover/photo:opacity-100 transition-all hover:scale-110 cursor-pointer"
                                     >
                                       <X className="w-3 h-3" />
                                     </button>
                                  </div>
                                ))}
                             </div>
                          )}

                          <div className="group">
                             <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                               {activeTab === 'ENTRY' ? 'Observação / Estado do Veículo e Equipamento' : 'Observação da Evidência de Saída'}
                             </label>
                             <textarea 
                               placeholder={activeTab === 'ENTRY' 
                                 ? "Descreva o estado do veículo/equipamento (ex: veículo com amassado no para-choque, placa conferida, caçamba limpa)..." 
                                 : "Descreva o estado do equipamento na saída (ex: equipamento em perfeito estado, liberado com o motorista)..."}
                               value={observation}
                               onChange={(e) => setObservation(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-xs min-h-[72px] custom-scrollbar"
                             />
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab !== 'IN_PLANTA' && (
                    <div className="px-6 md:px-8 pb-5">
                      <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-5 md:p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                              <Hash className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">Matrícula de Confirmação</p>
                              <p className="text-[11px] text-slate-500">Digite seu código de matrícula cadastrado para validar no banco</p>
                            </div>
                          </div>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Digite o código da sua matrícula..."
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-xs tracking-wider uppercase shadow-xs"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab !== 'IN_PLANTA' && (
                    <>
                      {activeTab === 'ENTRY' && !['IN_ANALYSIS', 'DISCREPANCY'].includes(selectedReq.status) && (
                        <div className="px-6 md:px-8 pb-3">
                          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2.5 text-amber-800 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Para liberar a entrada ou registrar divergência, inicie a etapa <strong>Em Análise</strong> acima.</span>
                          </div>
                        </div>
                      )}

                      <div className="p-6 md:px-8 md:py-6 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                         <button 
                            onClick={handleConfirmMovement}
                            disabled={
                              processing || 
                              selectedMaterials.length === 0 || 
                              !signature ||
                              (activeTab === 'ENTRY' && !['IN_ANALYSIS', 'DISCREPANCY'].includes(selectedReq.status))
                            }
                            className={`flex-[3] py-3.5 px-6 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${activeTab === 'ENTRY' ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                            title={
                              activeTab === 'ENTRY' && !['IN_ANALYSIS', 'DISCREPANCY'].includes(selectedReq.status) 
                                ? "Disponível apenas quando a solicitação estiver Em Análise" 
                                : ""
                            }
                         >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                              <>
                                 <CheckCircle className="w-4 h-4" />
                                 {activeTab === 'ENTRY' ? `Liberar Entrada (${selectedMaterials.length})` : `Confirmar Saída (${selectedMaterials.length})`}
                              </>
                            )}
                         </button>
                         
                         <button 
                            onClick={() => setShowDiscrepancyModal(true)}
                            disabled={
                              processing || 
                              selectedReq.status === 'DISCREPANCY' ||
                              (activeTab === 'ENTRY' && selectedReq.status !== 'IN_ANALYSIS')
                            }
                            className="flex-1 py-3 px-4 bg-white text-rose-700 border border-rose-200 hover:bg-rose-50/70 disabled:opacity-40 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs disabled:cursor-not-allowed"
                            title={
                              selectedReq.status === 'DISCREPANCY' 
                                ? "Divergência já registrada nesta solicitação" 
                                : (activeTab === 'ENTRY' && selectedReq.status !== 'IN_ANALYSIS')
                                ? "Disponível apenas quando a solicitação estiver Em Análise"
                                : ""
                            }
                         >
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            {selectedReq.status === 'DISCREPANCY' ? 'Divergência Registrada' : 'Divergência'}
                         </button>
                      </div>
                    </>
                  )}
                  {activeTab === 'ENTRY' && (
                     <div className="px-6 md:px-8 pb-6 flex">
                        <button 
                           onClick={handleCancelEntry}
                           disabled={processing}
                           className="flex-1 py-2.5 bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 disabled:opacity-40 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
                        >
                           <XOctagon className="w-4 h-4" />
                           {selectedReq.status === 'DISCREPANCY' ? 'Cancelar / Recusar Entrada (Divergência)' : 'Não Compareceu / Cancelar Entrada'}
                        </button>
                     </div>
                  )}

                  {activeTab === 'IN_PLANTA' && (
                     <div className={`p-5 md:p-6 border-t flex items-center gap-3.5 ${
                       (selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason))
                         ? 'bg-amber-50/70 border-amber-200'
                         : 'bg-slate-50/60 border-slate-100'
                     }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          (selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason))
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-primary/10 text-primary'
                        }`}>
                           {(selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason)) ? (
                             <AlertTriangle className="w-5 h-5" />
                           ) : (
                             <CheckCircle className="w-5 h-5" />
                           )}
                        </div>
                        <div>
                           <p className="text-xs font-semibold text-slate-800">
                             {(selectedReq.status === 'DISCREPANCY' || Boolean(selectedReq.rejection_reason || selectedReq.reason)) 
                               ? 'Veículo e materiais em operação na planta (com divergência registrada)' 
                               : 'Veículo e materiais em operação na planta'}
                           </p>
                           <p className="text-xs text-slate-500 mt-0.5">
                              Destino designado: <span className="font-medium text-slate-700">{selectedReq.sector || 'Unidade Lins'}</span>. Nenhuma ação pendente na portaria.
                           </p>
                        </div>
                     </div>
                  )}
               </div>
             ) : (
               <div className="h-[550px] flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-200 relative overflow-hidden">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                     <Truck className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-800 font-bold text-lg mb-1">Central de Conferência</h3>
                  <p className="text-slate-500 text-xs max-w-sm text-center leading-relaxed">
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
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer overflow-y-auto"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-white w-full max-w-2xl max-h-[90vh] my-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 cursor-default border border-slate-200"
           >
              {/* Header fixo no topo com Botao de Fechar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider leading-none">Equipamento</p>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate mt-0.5">{detailMaterial.name}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setDetailMaterial(null)} 
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all shrink-0 cursor-pointer ml-2"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo com scroll completo */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                {/* Imagem do equipamento */}
                <div className="w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 h-48 sm:h-64 flex items-center justify-center relative shadow-inner">
                  {detailMaterial.image_url ? (
                    <img 
                      src={detailMaterial.image_url} 
                      alt={detailMaterial.name} 
                      className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-4">
                      <Camera className="w-12 h-12 mb-2 opacity-40" />
                      <p className="font-medium text-xs text-slate-400">Sem Foto Disponivel</p>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-xs">Visualizacao Tecnica</span>
                  </div>
                </div>

                {/* Especificacoes */}
                <div className="grid grid-cols-2 gap-3">
                  <DetailItem label="Marca" value={detailMaterial.brand || '---'} />
                  <DetailItem label="Modelo" value={detailMaterial.model || '---'} />
                  <DetailItem label="Nº de Série" value={detailMaterial.serial_number || 'REGISTRO ÚNICO'} />
                  <DetailItem label="Condição" value={detailMaterial.condition || 'USADO'} />
                </div>

                {detailMaterial.description && (
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wider">Descricao Adicional</p>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed whitespace-pre-wrap">
                      {detailMaterial.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Rodape */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button 
                  onClick={() => setDetailMaterial(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all text-xs shadow-xs active:scale-[0.99] cursor-pointer"
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
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200 cursor-default"
           >
              <div className="p-6 md:p-8">
                 <div className="flex items-center gap-3.5 mb-6">
                    <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
                       <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-900 leading-snug">Notificar Divergência</h3>
                       <p className="text-slate-500 font-normal text-xs">Alerta encaminhado ao Gestor de Segurança</p>
                    </div>
                 </div>

                 <div className="mb-6">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Qual a irregularidade identificada?</label>
                    <textarea 
                      value={discrepancyReason}
                      onChange={(e) => setDiscrepancyReason(e.target.value)}
                      placeholder="Ex: Material extra não listado, equipamento danificado, foto não confere..."
                      className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-xs font-normal text-slate-800 resize-none"
                    ></textarea>
                 </div>

                 <div className="flex gap-3">
                    <button 
                      onClick={() => setShowDiscrepancyModal(false)}
                      className="flex-1 py-2.5 text-slate-600 font-medium text-xs hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleNotifyDiscrepancy}
                      disabled={!discrepancyReason || processing}
                      className="flex-[2] py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar Alerta'}
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
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col md:flex-row max-h-[85vh] cursor-default"
          >
             {/* Left side: Company Info */}
             <div className="p-6 md:p-8 md:w-1/2 border-r border-slate-100 flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-start mb-6">
                      <div 
                       className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-xs"
                       style={{ backgroundColor: selectedCompany.theme_color || '#0032A0' }}
                      >
                         {selectedCompany.logo_url ? (
                           <img src={selectedCompany.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                         ) : (
                           selectedCompany.full_name[0]
                         )}
                      </div>
                      <button 
                       onClick={() => setSelectedCompany(null)}
                       className="p-2 bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all md:hidden"
                      >
                        <X className="w-5 h-5" />
                      </button>
                   </div>

                   <div className="mb-6">
                      <span className="text-xs font-semibold text-primary">Perfil da Empresa</span>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug mt-0.5">{selectedCompany.full_name}</h3>
                   </div>

                   <div className="space-y-4">
                      <DetailItem label="Representante" value={selectedCompany.representative_name || 'NÃO INFORMADO'} />
                      <DetailItem label="CNPJ" value={selectedCompany.cnpj || 'NÃO INFORMADO'} />
                      <DetailItem label="Telefone" value={selectedCompany.phone || 'NÃO INFORMADO'} />
                   </div>
                </div>

                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-3 rounded-xl mt-6 transition-all shadow-xs cursor-pointer"
                >
                  Fechar Detalhes
                </button>
             </div>

             {/* Right side: Movement History */}
             <div className="p-6 md:p-8 md:w-1/2 bg-slate-50 flex flex-col overflow-hidden">
                <div className="mb-4 flex items-center justify-between">
                   <h4 className="text-xs font-semibold text-slate-700">Histórico de Movimentações</h4>
                   <span className="bg-white text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full border border-slate-200">
                     {auditHistory.length} registros
                   </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                   {auditHistory.length === 0 ? (
                      <div className="bg-white rounded-xl p-6 text-center border border-slate-100 shadow-xs">
                         <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                         <p className="text-xs text-slate-400">Sem movimentações registradas</p>
                      </div>
                   ) : auditHistory.map((item) => (
                      <div key={item.id} className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 group hover:border-primary/30 transition-all">
                         <div className="flex justify-between items-start mb-1.5">
                            <div>
                               <p className="text-xs font-semibold text-slate-800">{item.material.name}</p>
                               <p className="text-[11px] text-slate-500">
                                 {item.from_sector?.name || 'ENTRADA'} → {item.to_sector?.name || 'SAÍDA'}
                               </p>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatDateTime(item.moved_at).date} {formatDateTime(item.moved_at).time}
                            </span>
                         </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                             <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                                   {item.actor?.full_name?.[0]}
                                </div>
                                <p className="text-[11px] text-slate-600">
                                   Por: <span className="font-medium text-slate-800">{item.actor?.full_name}</span>
                                   {item.signature && (
                                     item.signature.startsWith('data:image/') ? (
                                       <span className="ml-1.5 inline-block bg-white border border-slate-200 rounded p-0.5 align-middle">
                                          <img src={item.signature} alt="Visto" className="h-3.5 object-contain" />
                                       </span>
                                     ) : (
                                       <span className="ml-1 text-primary">[{item.signature}]</span>
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
                                 className="p-1 bg-primary/10 text-primary rounded-md hover:bg-primary hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                               >
                                  <Camera className="w-3 h-3" />
                                  <span className="text-[10px] font-bold">{item.photos.length}</span>
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
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200 cursor-default"
           >
              <div className="p-6 md:p-8 text-center">
                 <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-xs ${modalConfig.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                    {modalConfig.type === 'success' ? (
                      <CheckCircle className="w-7 h-7" />
                    ) : (
                      <AlertTriangle className="w-7 h-7" />
                    )}
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-1">{modalConfig.title}</h3>
                 <p className="text-slate-500 text-xs leading-relaxed mb-6">{modalConfig.message}</p>
                 
                 <button 
                   onClick={() => setShowSuccessModal(false)}
                   className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-95 shadow-xs cursor-pointer ${modalConfig.type === 'success' ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
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
