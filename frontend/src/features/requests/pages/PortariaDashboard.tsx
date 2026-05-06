import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAuthToken } from '../../../utils/subdomain';
import { Truck, Search, CheckCircle, Loader2, Package, Hash, Info, LogOut, Eye, AlertTriangle, X, Camera, ShieldAlert } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
  condition: string;
  image_url?: string;
  status: 'PENDING' | 'IN_PLANTA' | 'OUT_PLANTA';
}

interface Requisicao {
  id: string;
  tenant_id: string;
  sector: string;
  entry_date: string;
  created_at: string;
  status: string;
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
  const [auditHistory, setAuditHistory] = useState<any[]>([]);

  const fetchAuditHistory = async (tenantId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/portaria/audit/${tenantId}`, {
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
    } else {
      setAuditHistory([]);
    }
  }, [selectedCompany]);

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

  const handleToggleMaterial = (id: string) => {
    setSelectedMaterials(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleConfirmMovement = async () => {
    if (!selecionadoId || selectedMaterials.length === 0) return;
    
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
          type: activeTab
        })
      });

      if (response.ok) {
        setRequisicoes(prev => prev.filter(r => r.id !== selecionadoId));
        setSelecionadoId(null);
        alert(activeTab === 'ENTRY' ? 'Entrada confirmada!' : 'Saída confirmada!');
        fetchRequisicoes();
      } else {
        alert('Erro ao processar movimentação.');
      }
    } catch (err) {
      alert('Erro de rede.');
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
        alert('Divergência notificada ao Gestor de Segurança!');
        fetchRequisicoes();
      } else {
        alert('Erro ao notificar divergência.');
      }
    } catch (err) {
      alert('Erro de rede.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredReqs = Array.isArray(requisicoes) ? requisicoes.filter(r => 
    r.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('pt-BR'),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-brand antialiased text-navy">
      <nav className="bg-navy border-b border-navy/10 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="https://linsagro.com.br/wp-content/uploads/2022/07/cropped-Lins_Logo_Horizontal_RGB_Preferencial_20250512_Keenwork_AF.png" 
              alt="Lins" 
              className="h-10 brightness-[200%]"
            />
            <div className="h-6 w-px bg-white/20 mx-2 hidden md:block"></div>
            <div className="hidden md:block">
              <span className="text-[10px] text-blue-200/50 font-black uppercase tracking-[0.2em] leading-none">Gate Control</span>
              <h1 className="font-black text-white text-sm uppercase">Painel da Portaria</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {userProfile && (
              <div className="hidden md:flex items-center gap-3 pr-6 border-r border-white/10">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <span className="text-[10px] font-black text-blue-200">
                    {userProfile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter leading-none mb-1">Operador</span>
                  <span className="text-xs font-bold text-blue-100 leading-none">{userProfile.full_name}</span>
                </div>
              </div>
            )}
            
            <button 
              onClick={signOut} 
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-200 hover:text-white transition-all bg-white/5 py-2 px-4 rounded-full border border-white/10"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Tab Switcher */}
        <div className="flex gap-4 mb-10 bg-white p-1.5 rounded-[24px] border border-slate-100 w-fit shadow-sm">
           <button 
            onClick={() => setActiveTab('ENTRY')}
            className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ENTRY' ? 'bg-navy text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
           >
              Entrada na Planta
           </button>
           <button 
            onClick={() => setActiveTab('EXIT')}
            className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'EXIT' ? 'bg-navy text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
           >
              Saída da Planta
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* List Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
               <input 
                type="text" 
                placeholder="Buscar por Empresa ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-sm"
               />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {activeTab === 'ENTRY' ? 'Aguardando Entrada' : 'Veículos na Planta'}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === 'ENTRY' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {requisicoes.length} {activeTab === 'ENTRY' ? 'AGUARDANDO' : 'NA PLANTA'}
                  </span>
               </div>
               
               <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50">
                  {loading ? (
                    <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" /></div>
                  ) : filteredReqs.length === 0 ? (
                    <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                      {activeTab === 'ENTRY' ? 'Nenhum veículo na fila' : 'Nenhum veículo na planta'}
                    </div>
                  ) : filteredReqs.map(req => (
                    <button 
                      key={req.id}
                      onClick={() => setSelecionadoId(req.id)}
                      className={`w-full p-6 text-left transition-all hover:bg-slate-50 flex items-center justify-between group ${selecionadoId === req.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className={`p-3 rounded-xl transition-colors text-white font-black relative`}
                          style={{ backgroundColor: req.profile?.theme_color || '#0032A0' }}
                        >
                          <Truck className="w-5 h-5" />
                          {req.status === 'DISCREPANCY' && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-white">
                              <AlertTriangle className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-navy text-xs uppercase leading-none mb-1">{req.profile.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.sector}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">{req.id.slice(0, 8)}</p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-8">
             {selectedReq ? (
               <div className="bg-white rounded-[40px] shadow-2xl shadow-navy/5 border border-slate-100 p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                     <Truck className="w-64 h-64 -mr-20 -mt-20" />
                  </div>

                  <div className="relative flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-50 pb-10 mb-10">
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-4 inline-block ${activeTab === 'ENTRY' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600'}`}>
                          {activeTab === 'ENTRY' ? 'Verificação de Entrada' : 'Verificação de Saída'}
                        </span>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setSelectedCompany({
                              id: selectedReq.tenant_id,
                              full_name: selectedReq.profile.full_name,
                              representative_name: selectedReq.profile.representative_name,
                              phone: selectedReq.profile.phone,
                              cnpj: selectedReq.profile.cnpj,
                              logo_url: selectedReq.profile.logo_url,
                              theme_color: selectedReq.profile.theme_color
                            })}
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-all hover:scale-105 active:scale-95 overflow-hidden"
                            style={{ backgroundColor: selectedReq.profile.theme_color || '#0032A0' }}
                          >
                             {selectedReq.profile.logo_url ? (
                               <img src={selectedReq.profile.logo_url} alt="" className="w-full h-full object-cover" />
                             ) : (
                               selectedReq.profile.full_name[0]
                             )}
                          </button>
                          <div>
                            <h3 className="text-4xl font-black text-navy uppercase tracking-tighter leading-none mb-2">{selectedReq.profile.full_name}</h3>
                            <p className="text-slate-400 font-medium tracking-tight">
                              {activeTab === 'ENTRY' 
                                ? `Liberado pelo Líder às ${formatDateTime(selectedReq.entry_date).time}` 
                                : `Entrou na planta às ${selectedReq.created_at ? formatDateTime(selectedReq.created_at).time : '--:--'}`}
                            </p>
                          </div>
                        </div>
                      </div>
                     <div className="text-right">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Protocolo</span>
                        <code className="bg-slate-50 px-4 py-2 rounded-xl text-navy font-black text-xs border border-slate-100 italic">#{selectedReq.id.slice(0, 8)}</code>
                     </div>
                  </div>

                  {selectedReq.status === 'DISCREPANCY' && (
                    <div className="mb-10 p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-6 animate-pulse">
                        <div className="p-4 bg-amber-500 rounded-2xl shadow-lg shadow-amber-200">
                           <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Divergência Notificada</p>
                           <p className="text-sm font-bold text-amber-900 uppercase">Aguardando confirmação do Gestor de Segurança.</p>
                        </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                     <div className="space-y-6">
                        <InfoItem label="Setor Destinado" value={selectedReq.sector} icon={<Hash className="w-4 h-4 text-primary" />} />
                        <InfoItem label="Data Agendada" value={formatDateTime(selectedReq.entry_date).date} icon={<Hash className="w-4 h-4 text-primary" />} />
                        <InfoItem label="Status Operacional" value={selectedReq.status || 'N/A'} icon={<Hash className="w-4 h-4 text-emerald-500" />} />
                     </div>
                     <div className="bg-[#F8FAFC] p-8 rounded-[32px] border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                              <Package className="w-5 h-5 text-primary" />
                              <h4 className="font-black text-navy text-[10px] uppercase tracking-widest">Carga ({selectedReq.materials.length})</h4>
                           </div>
                           <button 
                            onClick={() => setSelectedMaterials(selectedReq.materials.map(m => m.id))}
                            className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                           >
                              Selecionar Tudo
                           </button>
                        </div>
                        <ul className="space-y-4">
                           {selectedReq.materials.map(mat => (
                             <li key={mat.id} className="flex items-center justify-between group/mat">
                                <label className="flex items-center gap-4 cursor-pointer group/item flex-1">
                                   <input 
                                    type="checkbox" 
                                    checked={selectedMaterials.includes(mat.id)}
                                    onChange={() => handleToggleMaterial(mat.id)}
                                    className="w-5 h-5 rounded-lg border-2 border-slate-200 text-navy focus:ring-navy transition-all cursor-pointer"
                                   />
                                   <div>
                                      <p className={`text-xs font-black uppercase transition-colors ${selectedMaterials.includes(mat.id) ? 'text-navy' : 'text-slate-400'}`}>{mat.name}</p>
                                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest leading-none mt-0.5">SN: {mat.serial_number || 'REGISTRO ÚNICO'}</p>
                                   </div>
                                </label>
                                <button 
                                  onClick={() => setDetailMaterial(mat)}
                                  className="p-2 opacity-0 group-hover/mat:opacity-100 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                             </li>
                           ))}
                        </ul>
                     </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                     <button 
                        onClick={handleConfirmMovement}
                        disabled={processing || selectedMaterials.length === 0 || selectedReq.status === 'DISCREPANCY'}
                        className={`flex-[3] py-6 rounded-3xl shadow-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 ${activeTab === 'ENTRY' ? 'bg-navy hover:bg-[#002880] text-white shadow-navy/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}
                     >
                        {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                          <>
                             <CheckCircle className="w-6 h-6 text-white" />
                             {activeTab === 'ENTRY' ? 'Confirmar Entrada Selecionados' : 'Confirmar Saída Selecionados'}
                          </>
                        )}
                     </button>
                     
                     <button 
                        onClick={() => setShowDiscrepancyModal(true)}
                        disabled={processing || selectedReq.status === 'DISCREPANCY'}
                        className="flex-1 py-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-3xl shadow-xl shadow-amber-200 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95"
                     >
                        <ShieldAlert className="w-5 h-5" />
                        Notificar Gestor
                     </button>

                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-slate-100 border-dashed">
                  <div className="p-8 bg-slate-50 rounded-full mb-6">
                     <Truck className="w-16 h-16 text-slate-200" />
                  </div>
                  <h3 className="text-navy font-black text-lg uppercase tracking-tighter">Selecione um Veículo</h3>
                  <p className="text-slate-400 font-medium mt-2 max-w-sm text-center">Inicie a conferência física selecionando uma empresa autorizada na lista ao lado.</p>
               </div>
             )}
          </div>

        </div>
      </main>

      {/* Material Detail Modal */}
      {detailMaterial && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
              <div className="md:w-1/2 bg-slate-50 relative min-h-[400px]">
                 {detailMaterial.image_url ? (
                   <img src={detailMaterial.image_url} alt={detailMaterial.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Camera className="w-20 h-20 mb-4 opacity-20" />
                      <p className="font-black text-[10px] uppercase tracking-widest">Sem Foto Disponível</p>
                   </div>
                 )}
                 <div className="absolute top-6 left-6">
                    <span className="bg-navy/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">Visualização Técnica</span>
                 </div>
              </div>
              <div className="md:w-1/2 p-12 flex flex-col justify-between">
                 <div>
                    <div className="flex justify-between items-start mb-8">
                       <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Equipamento</p>
                          <h2 className="text-4xl font-black text-navy uppercase leading-none tracking-tighter">{detailMaterial.name}</h2>
                       </div>
                       <button onClick={() => setDetailMaterial(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-navy rounded-2xl transition-all">
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
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Descrição Adicional</p>
                       <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          {detailMaterial.description || 'Nenhuma descrição detalhada fornecida para este item.'}
                       </p>
                    </div>
                 </div>

                 <button 
                  onClick={() => setDetailMaterial(null)}
                  className="w-full bg-navy text-white font-black uppercase tracking-widest py-6 rounded-3xl mt-12 hover:bg-[#002880] transition-all"
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
           <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-amber-500/20">
              <div className="p-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-amber-500 rounded-2xl">
                       <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-navy uppercase tracking-tighter">Notificar Divergência</h3>
                       <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Alerta ao Gestor de Segurança</p>
                    </div>
                 </div>

                 <div className="mb-10">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Qual a irregularidade identificada?</label>
                    <textarea 
                      value={discrepancyReason}
                      onChange={(e) => setDiscrepancyReason(e.target.value)}
                      placeholder="Ex: Material extra não listado, equipamento danificado, foto não confere..."
                      className="w-full h-40 bg-slate-50 border border-slate-100 rounded-3xl p-6 focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-bold text-sm resize-none"
                    ></textarea>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => setShowDiscrepancyModal(false)}
                      className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-navy transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleNotifyDiscrepancy}
                      disabled={!discrepancyReason || processing}
                      className="flex-[2] py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-200 transition-all active:scale-95 disabled:opacity-50"
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
          <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col md:flex-row max-h-[90vh]">
             {/* Left side: Company Info */}
             <div className="p-8 md:w-1/2 border-r border-slate-100 flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-start mb-8">
                      <div 
                       className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl"
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
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Perfil da Empresa</span>
                      <h3 className="text-2xl font-black text-navy uppercase leading-tight mt-1">{selectedCompany.full_name}</h3>
                   </div>

                   <div className="space-y-6">
                      <DetailItem label="Representante" value={selectedCompany.representative_name || 'NÃO INFORMADO'} />
                      <DetailItem label="CNPJ" value={selectedCompany.cnpj || 'NÃO INFORMADO'} />
                      <DetailItem label="Telefone" value={selectedCompany.phone || 'NÃO INFORMADO'} />
                   </div>
                </div>

                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-navy text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl mt-10 hover:bg-[#002880] transition-all shadow-xl shadow-navy/20"
                >
                  Fechar Detalhes
                </button>
             </div>

             {/* Right side: Movement History */}
             <div className="p-8 md:w-1/2 bg-slate-50 flex flex-col overflow-hidden">
                <div className="mb-6 flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Movimentações</h4>
                   <span className="bg-white text-navy text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-200">
                     {auditHistory.length} REGISTROS
                   </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                   {auditHistory.length === 0 ? (
                      <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm">
                         <Info className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem movimentações registradas</p>
                      </div>
                   ) : auditHistory.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 group hover:border-primary/20 transition-all">
                         <div className="flex justify-between items-start mb-2">
                            <div>
                               <p className="text-[10px] font-black text-navy uppercase">{item.material.name}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                 {item.from_sector?.name || 'ENTRADA'} → {item.to_sector?.name || 'SAÍDA'}
                               </p>
                            </div>
                            <span className="text-[9px] font-black text-slate-300 whitespace-nowrap">
                              {formatDateTime(item.moved_at).date} {formatDateTime(item.moved_at).time}
                            </span>
                         </div>
                         <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                               {item.actor?.full_name?.[0]}
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                               Ação por: <span className="text-navy">{item.actor?.full_name}</span>
                            </p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
       <p className="font-bold text-navy text-sm">{value}</p>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-navy uppercase">{value}</p>
      </div>
    </div>
  );
}

