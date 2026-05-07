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
  Plus
} from 'lucide-react';
import { LiderSidebar } from '../components/dashboard/LiderSidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AcceptModal } from '../components/dashboard/AcceptModal';
import { TransferModal } from '../components/dashboard/TransferModal';

interface Material {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
  condition: string;
  code: string;
  image_url: string;
  status: 'PENDING' | 'IN_PLANTA' | 'OUT_PLANTA' | 'MOVING';
  request?: {
    profile: {
      full_name: string;
      theme_color: string;
    }
  }
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
      const response = await api.get(`/gestor/audit/${profile.tenant_id}`, {
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

  const handleTransfer = async (toSectorId: string, signature: string) => {
    if (selectedForTransfer.length === 0) return;
    setIsProcessing(true);
    try {
      await api.post('/lider/transferir', {
        materialIds: selectedForTransfer,
        toSectorId,
        signature
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

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [itemToAccept, setItemToAccept] = useState<{id: string, name: string} | null>(null);

  const handleAcceptClick = (materialId: string, materialName: string) => {
    setItemToAccept({ id: materialId, name: materialName });
    setIsAcceptModalOpen(true);
  };

  const handleAcceptConfirm = async (signature: string) => {
    if (!itemToAccept) return;
    setIsProcessing(true);
    
    try {
      await api.post('/lider/aceitar-transferencia', {
        materialIds: [itemToAccept.id],
        signature
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

  const filteredMaterials = sectorMaterials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <main className="flex-1 overflow-y-auto p-10 bg-industrial-grid">
          {activeSection === 'approvals' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-navy uppercase tracking-tighter italic">
                      Aprovações <span className="text-primary not-italic">Pendentes</span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Valide as solicitações de entrada para seu setor.</p>
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendências</p>
                      <p className="text-xl font-bold text-navy">{requisicoes.length}</p>
                    </div>
                  </div>
               </div>

               {loading ? (
                 <LoadingState />
               ) : requisicoes.length === 0 ? (
                 <EmptyState icon={<Check className="w-12 h-12 text-emerald-400" />} title="Sem Pendências" description="Tudo em ordem no seu setor." />
               ) : (
                 <div className="space-y-6">
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
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-navy uppercase tracking-tighter italic">
                      Equipamentos no <span className="text-primary not-italic">Setor</span>
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Gerencie os ativos atualmente sob sua responsabilidade.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Buscar por nome, código ou serial..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold text-navy w-80 outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                      />
                    </div>
                    {selectedForTransfer.length > 0 && (
                      <button 
                        onClick={() => setIsTransferModalOpen(true)}
                        className="bg-primary text-white font-bold text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Transferir ({selectedForTransfer.length})
                      </button>
                    )}
                  </div>
               </div>

               {loading ? (
                 <LoadingState />
               ) : filteredMaterials.length === 0 ? (
                 <EmptyState icon={<Package className="w-12 h-12 text-slate-300" />} title="Setor Vazio" description="Nenhum material encontrado com os filtros atuais." />
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {filteredMaterials.map(mat => (
                     <MaterialCard 
                       key={mat.id} 
                       mat={mat} 
                       isSelected={selectedForTransfer.includes(mat.id)}
                       onSelect={(id: string) => setSelectedForTransfer(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                       onAccept={() => handleAcceptClick(mat.id, mat.name)}
                       onViewDetails={() => setSelectedMaterial(mat)}
                     />
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeSection === 'movements' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div>
                  <h2 className="text-3xl font-bold text-navy uppercase tracking-tighter italic">
                    Histórico de <span className="text-primary not-italic">Movimentações</span>
                  </h2>
                  <p className="text-slate-400 font-medium mt-1">Rastro completo de ativos que passaram pelo setor.</p>
               </div>

               <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data/Hora</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equipamento</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origem → Destino</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Visto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {movements.map((move, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-4">
                             <p className="text-xs font-bold text-navy">{new Date(move.moved_at).toLocaleDateString('pt-BR')}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{new Date(move.moved_at).toLocaleTimeString('pt-BR')}</p>
                          </td>
                          <td className="px-8 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                   <Package className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-navy uppercase">{move.material?.name}</p>
                                   <p className="text-[9px] text-primary font-bold uppercase tracking-widest">{move.material?.request?.profile?.full_name}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-4">
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md">{move.from_sector?.name || '---'}</span>
                                <Send className="w-3 h-3 text-slate-300" />
                                <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-md">{move.to_sector?.name || '---'}</span>
                             </div>
                          </td>
                          <td className="px-8 py-4">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-navy text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                                   {move.actor?.full_name?.[0]}
                                </div>
                                <span className="text-xs font-bold text-navy">{move.actor?.full_name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-4">
                             <div className="flex justify-center">
                                <span className="bg-slate-100 text-navy text-[10px] font-black px-2 py-1 rounded border border-slate-200 min-w-[32px] text-center">
                                   {move.signature?.startsWith('data:image/') ? (
                                      <img src={move.signature} alt="Visto" className="h-6 object-contain" />
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
    </div>
  );
}

// Subcomponents
function RequestCard({ req, onApprove, onReject, onSelectCompany, onSelectMaterial }: any) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:border-primary/20 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
      
      <div className="relative flex flex-col lg:flex-row gap-10">
         <div className="flex-1">
           <div className="flex items-center gap-4 mb-6">
              <button 
               onClick={() => onSelectCompany(req.profile)}
               className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl transition-all hover:scale-110 active:scale-95 overflow-hidden group/logo"
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
                 <div className="absolute inset-0 bg-black/0 group-hover/logo:bg-black/20 transition-colors flex items-center justify-center">
                   <Plus className="w-5 h-5 text-white opacity-0 group-hover/logo:opacity-100 scale-50 group-hover/logo:scale-100 transition-all" />
                 </div>
              </button>
              <div className="flex-1">
                 <button 
                   onClick={() => onSelectCompany(req.profile)}
                   className="text-xl font-bold text-navy uppercase leading-none hover:text-primary transition-colors text-left"
                 >
                   {req.profile?.full_name}
                 </button>
                 <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}></div>
                       <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Terceirizada</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      {new Date(req.entry_date).toLocaleDateString('pt-BR')}
                    </span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Setor Destino</p>
                 <p className="font-bold text-navy text-sm italic">{req.sector}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Horário Previsto</p>
                 <p className="font-bold text-navy text-sm">
                   {new Date(req.entry_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                 </p>
              </div>
           </div>
         </div>

         <div className="flex-1 lg:border-l lg:border-slate-50 lg:pl-10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Itens ({req.materials.length})</p>
            <div className="grid grid-cols-1 gap-2">
               {req.materials.map((mat: any) => (
                 <button 
                   key={mat.id} 
                   onClick={() => onSelectMaterial(mat)}
                   className="w-full text-left bg-[#F8FAFC] p-3 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-primary/30 transition-all group/mat relative overflow-hidden"
                 >
                    <div className="absolute left-0 top-0 bottom-0 w-1 opacity-60" style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}></div>
                    <div className="pl-2">
                       <p className="font-bold text-navy text-[11px] uppercase group-hover/mat:text-primary transition-colors">{mat.name}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{mat.code || mat.serial_number || 'S/ Código'}</p>
                    </div>
                    <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">{mat.condition}</span>
                 </button>
               ))}
            </div>
         </div>

         <div className="flex lg:flex-col gap-4 justify-center">
           <button onClick={onApprove} className="w-16 h-16 bg-primary hover:bg-[#009e96] text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center transition-all active:scale-95 group/btn">
             <Check className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
           </button>
           <button onClick={onReject} className="w-16 h-16 bg-white border-2 border-slate-100 hover:border-red-100 text-slate-300 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all active:scale-95">
             <X className="w-8 h-8" />
           </button>
         </div>
      </div>
    </div>
  );
}

function MaterialCard({ mat, isSelected, onSelect, onAccept, onViewDetails }: any) {
  const isMoving = mat.status === 'MOVING';

  return (
    <div className={`bg-white rounded-3xl p-6 border transition-all relative overflow-hidden group ${
      isSelected ? 'border-primary shadow-xl shadow-primary/10 bg-primary/5' : 'border-slate-100 shadow-sm hover:border-primary/20 hover:shadow-md'
    }`}>
       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className={`p-3 rounded-2xl ${isSelected ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                <Package className="w-5 h-5" />
             </div>
             <div>
                <h4 className="font-bold text-navy uppercase text-xs leading-none mb-1 group-hover:text-primary transition-colors">{mat.name}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{mat.code || mat.serial_number || 'S/ Patrimônio'}</p>
             </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-[8px] font-bold uppercase px-2 py-1 rounded-lg border ${
              mat.status === 'IN_PLANTA' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
              mat.status === 'MOVING' ? 'bg-amber-50 text-amber-500 border-amber-100 animate-pulse' :
              'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              {mat.status === 'MOVING' ? 'Em Trânsito' : 'Em Planta'}
            </span>
          </div>
       </div>

       <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-100/50">
          <div className="flex justify-between items-center mb-2">
             <span className="text-[9px] text-slate-400 font-bold uppercase">Empresa</span>
             <span className="text-[10px] font-bold text-navy uppercase">{mat.request?.profile?.full_name}</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-[9px] text-slate-400 font-bold uppercase">Estado</span>
             <span className="text-[10px] font-bold text-primary uppercase">{mat.condition}</span>
          </div>
       </div>

       <div className="flex gap-2">
          {isMoving ? (
            <button 
              onClick={onAccept}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Aceitar Item
            </button>
          ) : (
            <>
              <button 
                onClick={() => onSelect(mat.id)}
                className={`flex-1 font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isSelected ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isSelected ? 'Selecionado' : 'Selecionar'}
              </button>
              <button 
                onClick={onViewDetails}
                className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 rounded-xl flex items-center justify-center transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
       </div>
    </div>
  );
}

// Minimal versions of modals and states
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
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
            <button onClick={onClose} className="w-full bg-navy text-white font-bold text-xs uppercase py-4 rounded-xl">Concluído</button>
         </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: any) {
  return (
    <div>
       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
       <p className="font-bold text-navy text-xs">{value}</p>
    </div>
  );
}
