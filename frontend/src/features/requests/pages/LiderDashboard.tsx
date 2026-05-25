import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAuthToken } from '../../../utils/subdomain';
import { api } from '../../../lib/axios';
import { 
  Check, 
  X, 
  Loader2, 
  Package, 
  Send,
  Search,
  ClipboardList,
  Plus,
  Camera,
  Filter,
  ArrowRight,
  History,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { LiderSidebar } from '../components/dashboard/LiderSidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AcceptModal } from '../components/dashboard/AcceptModal';
import { TransferModal } from '../components/dashboard/TransferModal';
import { MobileNav } from '../components/dashboard/MobileNav';
import { 
  LayoutDashboard, 
  Package as PackageIcon, 
  History as HistoryIcon,
} from 'lucide-react';

interface Material {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  image_url?: string;
  code?: string;
  serial_number?: string;
  description?: string;
  condition: string;
  status: 'PENDING' | 'IN_PLANTA' | 'OUT_PLANTA' | 'MOVING' | 'WAITING_EXIT';
  entry_at?: string;
  exit_at?: string;
  current_sector_id?: string;
  pending_sector_id?: string;
  request?: any;
}

interface Requisicao {
  id: string;
  sector: string;
  entry_date: string;
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
  full_name: string;
  representative_name?: string;
  phone?: string;
  cnpj?: string;
  logo_url?: string;
  theme_color?: string;
}

interface LiderInfo {
  full_name: string;
  sector: string;
  sector_id?: string;
}

export default function LiderDashboard() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('approvals');
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [sectorMaterials, setSectorMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [liderInfo, setLiderInfo] = useState<LiderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedForTransfer, setSelectedForTransfer] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [itemToAccept, setItemToAccept] = useState<{ id: string; name: string } | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);

  const fetchPendencias = async () => {
    try {
      const response = await api.get('/lider/pendencias', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const responseData = response.data.data || response.data;
      setRequisicoes(responseData.requests || []);
      if (responseData.lider) {
        setLiderInfo(responseData.lider);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchSectorMaterials = async () => {
    try {
      const response = await api.get('/lider/meu-setor', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setSectorMaterials(response.data.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchMovements = async () => {
    try {
      if (!profile?.tenant_id) return;
      const response = await api.get(`/portaria/audit/${profile.tenant_id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setMovements(response.data.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPendencias(),
      fetchSectorMaterials(),
      fetchMovements()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRevisar = async (requestId: string, acao: 'APPROVE' | 'REJECT') => {
    try {
      await api.post(`/lider/revisar/${requestId}`, 
        { acao },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setRequisicoes(prev => prev.filter(r => r.id !== requestId));
      fetchSectorMaterials();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao processar ação.');
    }
  };

  const handleTransfer = async (toSectorId: string, signature: string, extraData?: any, photos?: string[]) => {
    if (selectedForTransfer.length === 0) return;
    setIsProcessing(true);
    try {
      await api.post('/lider/transferir', {
        materialIds: selectedForTransfer,
        toSectorId,
        signature,
        photos,
        ...extraData
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      setIsTransferModalOpen(false);
      setSelectedForTransfer([]);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao transferir.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkExit = async (signature: string) => {
    if (selectedForTransfer.length === 0) return;
    setIsProcessing(true);
    try {
      await api.post('/lider/marcar-saida', {
        materialIds: selectedForTransfer,
        signature
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      setIsTransferModalOpen(false);
      setSelectedForTransfer([]);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao enviar para portaria.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptClick = (materialId: string, materialName: string) => {
    setItemToAccept({ id: materialId, name: materialName });
    setIsAcceptModalOpen(true);
  };

  const handleAcceptConfirm = async (signature: string, photos?: string[]) => {
    if (!itemToAccept) return;
    setIsProcessing(true);
    
    try {
      await api.post('/lider/aceitar-transferencia', {
        materialIds: [itemToAccept.id],
        signature,
        photos
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setIsAcceptModalOpen(false);
      setItemToAccept(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao aceitar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = async (materialId: string) => {
    if (!window.confirm("Deseja realmente recusar esta transferência? O item voltará para o setor de origem.")) return;
    
    setIsProcessing(true);
    try {
      await api.post('/lider/recusar-transferencia', {
        materialIds: [materialId]
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao recusar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMaterials = sectorMaterials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [movementPage, setMovementPage] = useState(1);
  const MOVEMENTS_PER_PAGE = 10;
  const currentMovements = movements.slice((movementPage - 1) * MOVEMENTS_PER_PAGE, movementPage * MOVEMENTS_PER_PAGE);
  const totalMovementPages = Math.max(1, Math.ceil(movements.length / MOVEMENTS_PER_PAGE));

  const navItems = [
    { id: 'approvals', label: 'Aprovações', icon: <LayoutDashboard /> },
    { id: 'my-sector', label: 'Meu Setor', icon: <PackageIcon /> },
    { id: 'movements', label: 'Histórico', icon: <HistoryIcon /> },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-brand overflow-hidden">
      <LiderSidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        userName={profile?.full_name}
        userRole={profile?.role}
        sectorName={liderInfo?.sector}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DashboardHeader section={activeSection} />

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-industrial-grid pb-24 md:pb-10">
          {activeSection === 'approvals' && (
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-navy uppercase tracking-tighter italic leading-none">
                      Aprovações <span className="text-primary not-italic">Pendentes</span>
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest mt-2">Valide as solicitações para seu setor.</p>
                  </div>
                  <div className="bg-white px-5 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between md:justify-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-xl">
                        <ClipboardList className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pendências</p>
                        <p className="text-lg md:text-xl font-black text-navy leading-none">{requisicoes.length}</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full md:bg-transparent md:p-0">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-[8px] font-black text-navy uppercase tracking-widest">Sincronizado</span>
                    </div>
                  </div>
               </div>

               {loading ? (
                 <LoadingState />
               ) : requisicoes.length === 0 ? (
                 <EmptyState icon={<Check className="w-12 h-12 text-emerald-400" />} title="Sem Pendências" description="Tudo em ordem no seu setor." />
               ) : (
                 <div className="space-y-4 md:space-y-6">
                   {requisicoes.map(req => (
                     <RequestCard 
                       key={req.id} 
                       req={req} 
                       onApprove={() => handleRevisar(req.id, 'APPROVE')}
                       onReject={() => handleRevisar(req.id, 'REJECT')}
                       onSelectCompany={setSelectedCompany}
                       onSelectMaterial={setSelectedMaterial}
                     />
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeSection === 'my-sector' && (
            <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-black text-navy uppercase tracking-tighter italic leading-none">
                      Equipamentos no <span className="text-primary not-italic">Setor</span>
                    </h2>
                    <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest mt-2">Gerencie os ativos atualmente sob sua responsabilidade.</p>
                    
                    <div className="mt-6 flex flex-col md:flex-row gap-3">
                       <div className="relative flex-1 group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="text" 
                            placeholder="Buscar por nome, código ou serial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-100 py-4 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                          />
                       </div>
                       <button className="bg-white border border-slate-100 p-4 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm shrink-0 flex items-center justify-center">
                          <Filter size={20} />
                       </button>
                    </div>
                  </div>

                  {selectedForTransfer.length > 0 && (
                    <div className="bg-navy p-2 rounded-3xl flex items-center justify-between gap-2 shadow-2xl shadow-navy/40 animate-in zoom-in slide-in-from-right-4 duration-300 w-full md:w-auto mt-4 md:mt-0">
                       <div className="px-3 md:px-4 py-2 flex-1 md:flex-none">
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Selecionados</p>
                          <p className="text-lg font-black text-white leading-none">{selectedForTransfer.length}</p>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                         <button 
                           onClick={() => setIsTransferModalOpen(true)}
                           className="bg-primary hover:bg-[#009e96] text-white px-4 md:px-6 h-[44px] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                         >
                           Transferir <ArrowRight size={14} />
                         </button>
                         <button 
                           onClick={() => setSelectedForTransfer([])}
                           className="h-[44px] w-[44px] flex items-center justify-center rounded-2xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                         >
                           <X size={18} />
                         </button>
                       </div>
                    </div>
                  )}
               </div>

               {loading ? (
                 <LoadingState />
               ) : filteredMaterials.length === 0 ? (
                 <EmptyState icon={<Package className="w-12 h-12 text-slate-300" />} title="Setor Vazio" description="Nenhum material encontrado com os filtros atuais." />
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                   {filteredMaterials.map(mat => (
                     <MaterialCard 
                       key={mat.id} 
                       mat={mat} 
                       isSelected={selectedForTransfer.includes(mat.id)}
                       onSelect={(id: string) => setSelectedForTransfer(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                       onAccept={() => handleAcceptClick(mat.id, mat.name)}
                       onReject={() => handleRejectClick(mat.id)}
                       onViewDetails={() => setSelectedMaterial(mat)}
                       currentSectorId={liderInfo?.sector_id || profile?.sector_id}
                     />
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeSection === 'movements' && (
            <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
               <div>
                  <h2 className="text-2xl md:text-3xl font-black text-navy uppercase tracking-tighter italic leading-none">
                    Histórico de <span className="text-primary not-italic">Movimentações</span>
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest mt-2">Rastro completo de ativos que passaram pelo setor.</p>
               </div>

               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                   {/* Desktop Table */}
                   <div className="hidden md:block overflow-x-auto">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50/50 border-b border-slate-100">
                         <tr>
                           <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Data/Hora</th>
                           <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Equipamento</th>
                           <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Origem → Destino</th>
                           <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Responsável</th>
                           <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Evidência</th>
                           <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Visto</th>
                         </tr>
                       </thead>
                        <tbody className="divide-y divide-slate-50">
                           {currentMovements.map((move, i) => (
                             <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-4 py-3">
                                 <p className="text-[11px] font-black text-navy uppercase">{new Date(move.moved_at).toLocaleDateString('pt-BR')}</p>
                                 <p className="text-[9px] text-slate-400 font-bold">{new Date(move.moved_at).toLocaleTimeString('pt-BR')}</p>
                              </td>
                              <td className="px-4 py-3">
                                 <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                       <Package className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                       <p className="text-[11px] font-black text-navy uppercase truncate">{move.material?.name}</p>
                                       <p className="text-[9px] text-primary font-black uppercase tracking-widest truncate">{move.material?.request?.profile?.full_name}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md max-w-[80px] truncate">{move.from_sector?.name || '---'}</span>
                                    <Send className="w-3 h-3 text-slate-300 shrink-0" />
                                    <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-md max-w-[80px] truncate">{move.to_sector?.name || '---'}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-navy text-white rounded-full flex items-center justify-center text-[9px] font-black shrink-0">
                                       {move.actor?.full_name?.[0]}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[11px] font-black text-navy uppercase truncate max-w-[120px]">{move.actor?.full_name}</span>
                                       {move.actor?.registration_number && (
                                         <span className="text-[9px] font-bold text-slate-400 mt-0.5">{move.actor.registration_number}</span>
                                       )}
                                    </div>
                                 </div>
                              </td>
                              <td className="px-4 py-3">
                                 <div className="flex justify-center">
                                    {move.photos && move.photos.length > 0 ? (
                                      <button 
                                        onClick={() => setSelectedPhotos(move.photos)}
                                        className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 group/photo"
                                      >
                                         <Camera className="w-3.5 h-3.5 group-hover/photo:scale-110 transition-transform" />
                                         <span className="text-[9px] font-black uppercase">{move.photos.length}</span>
                                      </button>
                                    ) : (
                                      <span className="text-[9px] text-slate-300 font-black uppercase italic">N/A</span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-4 py-3">
                                 <div className="flex justify-center">
                                    <span className="bg-slate-100 text-navy text-[9px] font-black px-2 py-1 rounded border border-slate-200 min-w-[32px] text-center max-w-[80px] truncate">
                                       {move.signature?.startsWith('data:image/') ? (
                                          <img src={move.signature} alt="Visto" className="h-5 object-contain" />
                                       ) : (
                                          move.signature || '--'
                                       )}
                                    </span>
                                 </div>
                              </td>
                            </tr>
                          ))}
                       </tbody>
                     </table>
                   </div>

                   {/* Mobile List */}
                   <div className="md:hidden divide-y divide-slate-50">
                      {currentMovements.map((move, i) => (
                        <div key={i} className="p-6 space-y-4">
                           <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-black text-navy uppercase leading-tight truncate">{move.material?.name}</p>
                                 <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1 truncate">{move.material?.request?.profile?.full_name}</p>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                 <p className="text-[10px] font-black text-navy leading-none mb-1">{new Date(move.moved_at).toLocaleDateString('pt-BR')}</p>
                                 <p className="text-[8px] text-slate-400 font-black uppercase">{new Date(move.moved_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                              <div className="flex-1 flex items-center justify-center gap-2">
                                 <span className="text-[9px] font-black text-slate-500 uppercase truncate">{move.from_sector?.name || 'EXTERNO'}</span>
                                 <ArrowRight size={10} className="text-slate-300 shrink-0" />
                                 <span className="text-[9px] font-black text-primary uppercase truncate">{move.to_sector?.name || 'S/ DESTINO'}</span>
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 bg-navy text-white rounded-full flex items-center justify-center text-[8px] font-black uppercase shadow-sm shrink-0">
                                    {move.actor?.full_name?.[0]}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-navy uppercase truncate max-w-[100px]">{move.actor?.full_name}</span>
                                    {move.actor?.registration_number && (
                                      <span className="text-[8px] font-bold text-slate-400 mt-0.5">{move.actor.registration_number}</span>
                                    )}
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 {move.photos && move.photos.length > 0 && (
                                   <button 
                                     onClick={() => setSelectedPhotos(move.photos)}
                                     className="p-2 bg-primary/10 text-primary rounded-lg flex items-center gap-1.5"
                                   >
                                      <Camera size={14} />
                                      <span className="text-[9px] font-black">{move.photos.length}</span>
                                   </button>
                                 )}
                                 <div className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                                    {move.signature?.startsWith('data:image/') ? (
                                      <img src={move.signature} alt="" className="h-4 object-contain" />
                                    ) : (
                                      <span className="text-[10px] text-slate-300 font-black">--</span>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>

                   {/* Paginação */}
                   {totalMovementPages > 1 && (
                     <div className="p-4 md:p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <button 
                          onClick={() => setMovementPage(p => Math.max(1, p - 1))}
                          disabled={movementPage === 1}
                          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        
                        <p className="text-[10px] font-black text-navy uppercase tracking-widest">
                          Página {movementPage} de {totalMovementPages}
                        </p>
                        
                        <button 
                          onClick={() => setMovementPage(p => Math.min(totalMovementPages, p + 1))}
                          disabled={movementPage === totalMovementPages}
                          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <ChevronRight size={18} />
                        </button>
                     </div>
                   )}
               </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isTransferModalOpen && (
        <TransferModal 
          materialIds={selectedForTransfer}
          onClose={() => setIsTransferModalOpen(false)}
          onConfirm={handleTransfer}
          onMarkExit={handleMarkExit}
          isProcessing={isProcessing}
        />
      )}

       {isAcceptModalOpen && itemToAccept && (
        <AcceptModal 
          materialName={itemToAccept.name}
          onClose={() => setIsAcceptModalOpen(false)}
          onConfirm={handleAcceptConfirm}
          isProcessing={isProcessing}
        />
      )}

      {selectedCompany && <CompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />}
      {selectedMaterial && <MaterialModal material={selectedMaterial} onClose={() => setSelectedMaterial(null)} />}
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
                       <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Protocolo de Segurança • {selectedPhotos.length} Fotos</p>
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

      <MobileNav 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        items={navItems} 
      />
    </div>
  );
}

// Subcomponents
function RequestCard({ req, onApprove, onReject, onSelectCompany, onSelectMaterial }: any) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 hover:border-primary/20 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
      
      <div className="relative flex flex-col lg:flex-row gap-6 md:gap-10">
         <div className="flex-1">
           <div className="flex items-center gap-4 mb-6">
              <button 
               onClick={() => onSelectCompany(req.profile)}
               className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-xl transition-all hover:scale-110 active:scale-95 overflow-hidden group/logo shrink-0"
               style={{ 
                 backgroundColor: req.profile?.theme_color || '#0032A0',
                 boxShadow: `0 10px 20px ${(req.profile?.theme_color || '#0032A0')}40`
               }}
              >
                 {req.profile?.logo_url ? (
                   <img src={req.profile.logo_url} alt="" className="w-full h-full object-cover" />
                 ) : (
                   req.profile?.full_name[0]
                 )}
              </button>
              <div className="flex-1 min-w-0">
                 <button 
                   onClick={() => onSelectCompany(req.profile)}
                   className="text-lg md:text-xl font-black text-navy uppercase leading-none hover:text-primary transition-colors text-left truncate block w-full"
                 >
                   {req.profile?.full_name}
                 </button>
                 <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                    <span className="text-[9px] text-primary font-black uppercase tracking-widest whitespace-nowrap bg-primary/5 px-2 py-0.5 rounded-md">Terceirizada</span>
                    <span className="text-slate-200">•</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase whitespace-nowrap">
                      {new Date(!req.entry_date.includes('Z') && !req.entry_date.includes('+') && !req.entry_date.match(/-\d{2}:\d{2}$/) ? `${req.entry_date}Z` : req.entry_date).toLocaleDateString('pt-BR')}
                    </span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex flex-col justify-center">
                 <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Setor Destino</p>
                 <p className="font-black text-navy text-xs md:text-sm uppercase tracking-tighter truncate">{req.sector}</p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex flex-col justify-center">
                 <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Horário Previsto</p>
                 <p className="font-black text-navy text-xs md:text-sm uppercase tracking-tighter">
                   {new Date(!req.entry_date.includes('Z') && !req.entry_date.includes('+') && !req.entry_date.match(/-\d{2}:\d{2}$/) ? `${req.entry_date}Z` : req.entry_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                 </p>
              </div>
           </div>
         </div>

         <div className="flex-1 lg:border-l lg:border-slate-50 lg:pl-10">
            <div className="flex justify-between items-center mb-3">
               <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Itens ({req.materials.length})</p>
               <span className="text-[8px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-full">Clique para Ver</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
               {req.materials.map((mat: any) => (
                 <button 
                   key={mat.id} 
                   onClick={() => onSelectMaterial(mat)}
                   className="w-full text-left bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 hover:border-primary/20 transition-all group/mat relative overflow-hidden"
                 >
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover/mat:bg-primary/10 group-hover/mat:text-primary transition-colors">
                          <Package size={14} />
                       </div>
                       <div>
                          <p className="font-black text-navy text-[10px] md:text-[11px] uppercase group-hover/mat:text-primary transition-colors truncate max-w-[120px]">{mat.name}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{mat.code || mat.serial_number || 'S/ Código'}</p>
                       </div>
                    </div>
                    <span className="text-[8px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-full">{mat.condition}</span>
                 </button>
               ))}
            </div>
         </div>

         <div className="flex lg:flex-col gap-3 md:gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
            <button onClick={onApprove} className="flex-1 lg:w-16 lg:h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center py-4 lg:py-0 transition-all active:scale-95 group/btn gap-2 lg:gap-0">
              <Check className="w-6 h-6 lg:w-8 lg:h-8 group-hover/btn:scale-110 transition-transform" />
              <span className="lg:hidden text-[10px] font-black uppercase tracking-widest">Aprovar</span>
            </button>
            <button onClick={onReject} className="flex-1 lg:w-16 lg:h-16 bg-white border border-slate-200 hover:border-rose-200 text-slate-300 hover:text-rose-500 rounded-2xl flex items-center justify-center py-4 lg:py-0 transition-all active:scale-95 gap-2 lg:gap-0">
              <X className="w-6 h-6 lg:w-8 lg:h-8" />
              <span className="lg:hidden text-[10px] font-black uppercase tracking-widest">Recusar</span>
            </button>
         </div>
      </div>
    </div>
  );
}

function MaterialCard({ mat, isSelected, onSelect, onAccept, onReject, onViewDetails, currentSectorId }: any) {
  const isMoving = mat.status === 'MOVING';
  const isIncoming = isMoving && mat.pending_sector_id === currentSectorId;

  return (
    <div className={`bg-white rounded-[2rem] p-5 border transition-all relative overflow-hidden group ${
      isSelected ? 'border-primary shadow-xl shadow-primary/10 bg-primary/5' : 'border-slate-100 shadow-sm hover:border-primary/20 hover:shadow-md'
    }`}>
       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                <Package size={20} />
             </div>
             <div className="min-w-0">
                <h4 className="font-black text-navy uppercase text-[11px] leading-tight mb-1 group-hover:text-primary transition-colors truncate">{mat.name}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{mat.code || mat.serial_number || 'S/ Patrimônio'}</p>
             </div>
          </div>
          <div className="shrink-0">
            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border shadow-sm ${
              mat.status === 'IN_PLANTA' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
              mat.status === 'MOVING' ? 'bg-amber-50 text-amber-500 border-amber-100 animate-pulse' :
              'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              {mat.status === 'MOVING' ? (isIncoming ? 'Chegando' : 'Saindo') : 'Em Planta'}
            </span>
          </div>
       </div>

       <div className="bg-slate-50/50 rounded-2xl p-4 mb-5 border border-slate-100/50 space-y-2">
          <div className="flex justify-between items-center">
             <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Proprietário</span>
             <span className="text-[10px] font-black text-navy uppercase truncate max-w-[120px]">{mat.request?.profile?.full_name}</span>
          </div>
          <div className="h-px bg-slate-100/50 w-full"></div>
          <div className="flex justify-between items-center">
             <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Condição</span>
             <span className="text-[10px] font-black text-primary uppercase">{mat.condition}</span>
          </div>
       </div>

       <div className="flex gap-2">
          {isIncoming ? (
            <>
              <button 
                onClick={onAccept}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Aceitar
              </button>
              <button 
                onClick={onReject}
                className="flex-1 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Recusar
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => !isMoving && onSelect(mat.id)}
                disabled={isMoving}
                className={`flex-1 font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isMoving ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent' :
                  isSelected ? 'bg-navy text-white shadow-navy/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {isSelected ? <><Check size={14} /> Selecionado</> : (isMoving ? 'Em Trânsito' : 'Selecionar')}
              </button>
              <button 
                onClick={onViewDetails}
                className="w-12 h-12 bg-white border border-slate-200 text-slate-300 hover:text-primary hover:border-primary/40 rounded-xl flex items-center justify-center transition-all active:scale-95 group/info"
              >
                <Eye size={18} className="group-hover/info:scale-110 transition-transform" />
              </button>
            </>
          )}
       </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-20 text-center bg-white rounded-3xl border border-slate-100">
       <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" />
       <p className="mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">Processando fluxos de segurança...</p>
    </div>
  );
}

function EmptyState({ icon, title, description }: any) {
  return (
    <div className="p-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
       <div className="bg-slate-50 p-6 rounded-full mb-6">{icon}</div>
       <h3 className="text-navy font-bold text-lg uppercase tracking-tight">{title}</h3>
       <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">{description}</p>
    </div>
  );
}

function CompanyModal({ company, onClose }: any) {
  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 cursor-default"
      >
         <div className="p-8">
            <div className="flex justify-between items-start mb-8">
               <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl" style={{ backgroundColor: company.theme_color || '#0032A0' }}>
                  {company.logo_url ? <img src={company.logo_url} alt="" className="w-full h-full object-cover" /> : company.full_name[0]}
               </div>
               <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-navy rounded-xl"><X className="w-6 h-6" /></button>
            </div>
            <h3 className="text-2xl font-bold text-navy uppercase leading-tight mb-8">{company.full_name}</h3>
            <div className="space-y-6">
               <DetailItem label="Representante" value={company.representative_name || '---'} />
               <DetailItem label="CNPJ" value={company.cnpj || '---'} />
               <DetailItem label="Telefone" value={company.phone || '---'} />
            </div>
            <button onClick={onClose} className="w-full bg-navy text-white font-bold text-xs uppercase py-4 rounded-xl mt-10">Fechar</button>
         </div>
      </div>
    </div>
  );
}

function MaterialModal({ material, onClose }: any) {
  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row cursor-default"
      >
         <div className="md:w-1/2 bg-slate-900 h-64 md:h-auto">
            {material.image_url ? <img src={material.image_url} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center opacity-10"><Package className="w-20 h-20 text-white" /></div>}
         </div>
         <div className="md:w-1/2 p-8 flex flex-col">
            <div className="flex justify-between mb-6">
               <div>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mb-1">Equipamento</p>
                  <h3 className="text-2xl font-bold text-navy uppercase leading-tight">{material.name}</h3>
               </div>
               <button onClick={onClose} className="p-2 text-slate-300 hover:text-navy"><X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
               <DetailItem label="Série" value={material.serial_number || '---'} />
               <DetailItem label="Código" value={material.code || '---'} />
               <DetailItem label="Fabricante" value={material.brand || '---'} />
               <DetailItem label="Condição" value={material.condition} />
            </div>
            {material.description && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 flex-1">
                 <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Descrição</p>
                 <p className="text-xs text-navy font-medium italic">"{material.description}"</p>
              </div>
            )}
            <button onClick={onClose} className="w-full bg-navy text-white font-bold text-xs uppercase py-4 rounded-xl mt-auto">Fechar</button>
         </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-2">{label}</p>
      <p className="text-navy font-bold text-sm uppercase">{value}</p>
    </div>
  );
}
