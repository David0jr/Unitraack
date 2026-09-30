import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, getTenantLogoUrl } from '../../../utils/subdomain';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MapPin, 
  LogOut, 
  Package, 
  Loader2, 
  Trash2, 
  Edit2, 
  XOctagon, 
  AlertTriangle, 
  Truck,
  X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTenant } from '../../../contexts/TenantContext';
import { api } from '../../../lib/axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { NotificationDropdown } from '../components/dashboard/NotificationDropdown';

export default function TerceirizadaDashboard() {
  const { signOut, user, profile: authProfile } = useAuth();
  const { tenant, slug: tenantSlug } = useTenant();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'historico' | 'equipamentos'>('historico');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profileRes = await api.get('/terceirizada/profile', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setProfile(profileRes.data.data || profileRes.data);

      const requestsRes = await api.get('/terceirizada/requisicoes', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      const reqs = requestsRes.data.data || requestsRes.data;
      setRequests(reqs || []);
    } catch (err) {
      console.error('[TerceirizadaDashboard] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: any = {
    'PENDING': { label: 'Em Análise (Líder)', color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200', icon: Clock },
    'APPROVED_LIDER': { label: 'Autorizado (Líder)', color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200', icon: CheckCircle2 },
    'REJECTED_LIDER': { label: 'Recusado (Líder)', color: 'text-rose-700', bg: 'bg-rose-50 border border-rose-200', icon: XCircle },
    'APPROVED_GESTOR': { label: 'Aguardando Chegada', color: 'text-sky-700', bg: 'bg-sky-50 border border-sky-200', icon: CheckCircle2 },
    'WAITING_ARRIVAL': { label: 'Aguardando Chegada', color: 'text-sky-700', bg: 'bg-sky-50 border border-sky-200', icon: Clock },
    'ARRIVED': { label: 'Chegada no Portão', color: 'text-indigo-700', bg: 'bg-indigo-50 border border-indigo-200', icon: Truck },
    'IN_ANALYSIS': { label: 'Em Análise (Portaria)', color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200', icon: Clock },
    'REJECTED_GESTOR': { label: 'Recusado (Gestor)', color: 'text-rose-700', bg: 'bg-rose-50 border border-rose-200', icon: XCircle },
    'APPROVED': { label: 'Aprovado', color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200', icon: CheckCircle2 },
    'REJECTED': { label: 'Recusado', color: 'text-rose-700', bg: 'bg-rose-50 border border-rose-200', icon: XCircle },
    'IN_PLANTA': { label: 'Dentro da Planta', color: 'text-purple-700', bg: 'bg-purple-50 border border-purple-200', icon: CheckCircle2 },
    'COMPLETED': { label: 'Finalizado', color: 'text-slate-600', bg: 'bg-slate-100 border border-slate-200', icon: CheckCircle2 },
    'CANCELED': { label: 'Cancelado', color: 'text-slate-500', bg: 'bg-slate-100 border border-slate-200', icon: XOctagon },
    'DISCREPANCY': { label: 'Divergência', color: 'text-rose-700', bg: 'bg-rose-50 border border-rose-200', icon: XCircle },
  };

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

  const handleCancel = async (id: string) => {
    const result = await Swal.fire({
      title: 'Cancelar Solicitação?',
      text: 'Tem certeza que deseja cancelar esta solicitação?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Voltar'
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/terceirizada/requisicoes/${id}/cancel`, {}, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        Swal.fire('Cancelada!', 'A solicitação foi cancelada com sucesso.', 'success');
        fetchData();
      } catch (err: any) {
        Swal.fire('Erro', err.response?.data?.message || 'Erro ao cancelar.', 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Excluir do Histórico?',
      text: 'Essa ação removerá o registro do seu painel definitivamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Voltar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/terceirizada/requisicoes/${id}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        Swal.fire('Excluído!', 'O registro foi removido com sucesso.', 'success');
        fetchData();
      } catch (err: any) {
        Swal.fire('Erro', err.response?.data?.message || 'Erro ao excluir.', 'error');
      }
    }
  };

  const handleEdit = (req: any) => {
    const slug = tenantSlug || authProfile?.tenant?.subdomain || 'painel';
    const rolePath = authProfile?.role?.toLowerCase().replace('_', '-') || 'terceirizada';
    
    if (slug !== 'painel') {
      navigate(`/${slug}/${rolePath}/painel/nova-solicitacao`, { state: { editMode: true, request: req } });
    } else {
      navigate('/painel/nova-solicitacao', { state: { editMode: true, request: req } });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] bg-industrial-grid text-slate-800 font-brand antialiased relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none"></div>
      
      {/* Navbar Superior */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs relative">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            {tenant || authProfile?.tenant ? (
              <img 
                src={getTenantLogoUrl(tenant || authProfile?.tenant, false)} 
                alt={tenant?.name || authProfile?.tenant?.name || 'Usina Lins'} 
                className="h-8 object-contain hover:opacity-80 transition-opacity max-w-[170px]"
                onError={(e) => {
                  e.currentTarget.src = '/logo-lins.png';
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shadow-xs">
                  U
                </div>
                <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:block">
                  Usina Lins
                </span>
              </div>
            )}
            <div className="h-5 w-px bg-slate-200 mx-1 hidden md:block"></div>
            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 font-medium leading-none block">Canal do Parceiro</span>
              <h1 className="font-semibold text-slate-800 text-xs">Painel de Logística</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-semibold text-slate-800 leading-none">{profile?.full_name || 'Carregando...'}</p>
              <p className="text-[10px] text-primary font-medium mt-0.5">Fornecedor Ativo</p>
            </div>
            <NotificationDropdown />
            <button 
              onClick={signOut}
              className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Olá, <span className="text-primary">{profile?.full_name || 'Empresa'}</span>
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 font-normal">Gerencie suas solicitações de entrada e remessas de materiais.</p>
          </div>

          <button 
            onClick={() => {
              const slug = tenantSlug || authProfile?.tenant?.subdomain || 'painel';
              const rolePath = authProfile?.role?.toLowerCase().replace('_', '-') || 'terceirizada';
              if (slug !== 'painel') {
                navigate(`/${slug}/${rolePath}/painel/nova-solicitacao`);
              } else {
                navigate('/painel/nova-solicitacao');
              }
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard 
            label="Total de Remessas" 
            value={requests.length.toString()} 
            icon={<Package className="w-5 h-5" />}
            color="bg-primary/10 text-primary"
          />
          <StatCard 
            label="Em Análise" 
            value={requests.filter(r => r.status === 'PENDING').length.toString()} 
            icon={<Clock className="w-5 h-5" />}
            color="bg-amber-50 text-amber-700 border border-amber-200"
          />
          <StatCard 
            label="Aprovados" 
            value={requests.filter(r => ['APPROVED_LIDER', 'APPROVED', 'APPROVED_GESTOR', 'WAITING_ARRIVAL', 'ARRIVED', 'IN_ANALYSIS', 'IN_PLANTA', 'COMPLETED'].includes(r.status)).length.toString()} 
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="bg-emerald-50 text-emerald-700 border border-emerald-200"
          />
        </div>

        {/* Requests Table/List */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-200/80">
               <button 
                  onClick={() => setActiveTab('historico')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                     activeTab === 'historico'
                       ? 'bg-white text-slate-800 shadow-xs' 
                       : 'bg-transparent text-slate-500 hover:text-slate-800'
                  }`}
               >
                  Histórico Recente
               </button>
               <button 
                  onClick={() => setActiveTab('equipamentos')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                     activeTab === 'equipamentos'
                       ? 'bg-white text-slate-800 shadow-xs' 
                       : 'bg-transparent text-slate-500 hover:text-slate-800'
                  }`}
               >
                  <Package className="w-3.5 h-3.5" />
                  Meus Equipamentos
               </button>
            </div>
            {activeTab === 'historico' && (
              <span className="bg-slate-50 text-slate-500 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 hidden sm:block">Últimos 30 dias</span>
            )}
          </div>

          {activeTab === 'equipamentos' && (
            <div className="p-5 bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Dentro da Planta */}
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
                    <div className="p-3.5 border-b border-slate-100 bg-purple-50/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                         <h3 className="font-semibold text-slate-800 text-xs">Dentro da Planta</h3>
                      </div>
                      <span className="bg-white text-purple-700 border border-purple-200 text-xs font-semibold px-2 py-0.5 rounded-full shadow-xs">
                        {(() => {
                           return requests.flatMap(r => r.materials || []).filter((m: any) => m.status === 'IN_PLANTA' || m.status === 'WAITING_EXIT').length;
                        })()}
                      </span>
                    </div>
                    <div className="p-3.5 flex-1 max-h-[280px] overflow-y-auto space-y-2 custom-scrollbar">
                      {(() => {
                         const inPlantaMaterials = requests
                           .flatMap(r => (r.materials || []).map((m: any) => ({ ...m, reqId: r.id, driver: r.driver_name })))
                           .filter(m => m.status === 'IN_PLANTA' || m.status === 'WAITING_EXIT');
                         
                         if (inPlantaMaterials.length === 0) {
                           return <p className="text-xs text-slate-400 font-normal text-center py-6">Nenhum equipamento na planta.</p>;
                         }
                         return inPlantaMaterials.map((mat, i) => (
                           <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50/60 rounded-xl border border-slate-200/80 hover:border-purple-300 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0 text-purple-600 border border-slate-100">
                                 <Package className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{mat.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono truncate">SN: {mat.serial_number || 'N/A'}</p>
                              </div>
                              <div className="text-right shrink-0">
                                 <span className="text-[10px] text-slate-400 block">Resp:</span>
                                 <p className="text-xs font-medium text-slate-700 truncate max-w-[90px]">{mat.driver?.split(' ')[0]}</p>
                              </div>
                           </div>
                         ));
                      })()}
                    </div>
                  </div>

                  {/* Já Deu Saída */}
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                         <h3 className="font-semibold text-slate-800 text-xs">Já Deu Saída (Finalizado)</h3>
                      </div>
                      <span className="bg-white text-slate-600 border border-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full shadow-xs">
                        {(() => {
                           return requests.flatMap(r => r.materials || []).filter((m: any) => m.status === 'OUT_PLANTA').length;
                        })()}
                      </span>
                    </div>
                    <div className="p-3.5 flex-1 max-h-[280px] overflow-y-auto space-y-2 custom-scrollbar">
                      {(() => {
                         const completedMaterials = requests
                           .flatMap(r => (r.materials || []).map((m: any) => ({ ...m, reqId: r.id, driver: r.driver_name })))
                           .filter(m => m.status === 'OUT_PLANTA');
                         
                         if (completedMaterials.length === 0) {
                           return <p className="text-xs text-slate-400 font-normal text-center py-6">Nenhum equipamento finalizado.</p>;
                         }
                         return completedMaterials.map((mat, i) => (
                           <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50/40 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 shadow-xs">
                                 <Package className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-600 truncate">{mat.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono truncate">SN: {mat.serial_number || 'N/A'}</p>
                              </div>
                              <div className="text-right shrink-0">
                                 <span className="text-[10px] text-slate-400 block">Protocolo:</span>
                                 <p className="text-xs font-medium text-slate-600 truncate max-w-[90px]">#{mat.reqId?.slice(0, 8)}</p>
                              </div>
                           </div>
                         ));
                      })()}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'historico' && (
          <div className="overflow-x-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500">Motorista / Placa</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500">Setor Destino</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500">Data Solicitação</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary opacity-40" />
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-normal">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                ) : requests.map((req) => {
                  const status = (req?.status && statusMap[req.status]) ? statusMap[req.status] : statusMap['PENDING'];
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${status?.bg || 'bg-slate-50'} ${status?.color || 'text-slate-500'}`}>
                            {status?.icon && <status.icon className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">{req.driver_name || 'N/A'}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{req.plate || 'SEM PLACA'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                         <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {req.sector || 'Geral'}
                         </div>
                      </td>
                      <td className="px-5 py-3.5">
                         <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(req.created_at).toLocaleDateString()}
                         </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                           {/* Botão de Detalhes sempre visível */}
                           <button 
                              onClick={() => setSelectedRequest(req)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                              title="Ver Detalhes"
                           >
                             <Package className="w-4 h-4" />
                           </button>

                           {/* Editar: Análise ou Aprovado (volta para análise) */}
                           {['PENDING', 'APPROVED_LIDER', 'APPROVED_GESTOR', 'APPROVED', 'REJECTED_LIDER', 'REJECTED_GESTOR', 'REJECTED'].includes(req.status) && (
                             <button 
                                onClick={() => handleEdit(req)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                                title="Editar Pedido"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                           )}

                           {/* Cancelar: Apenas se estiver em análise */}
                           {req.status === 'PENDING' && (
                             <button 
                                onClick={() => handleCancel(req.id)}
                                className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                                title="Cancelar Pedido"
                             >
                               <XOctagon className="w-4 h-4" />
                             </button>
                           )}
                           
                           {/* Excluir: Apenas se foi recusado ou cancelado */}
                           {['REJECTED_LIDER', 'REJECTED_GESTOR', 'REJECTED', 'CANCELED'].includes(req.status) && (
                             <button 
                                onClick={() => handleDelete(req.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Excluir do Histórico"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </main>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <span className="text-xs font-semibold text-primary">Protocolo #{selectedRequest.id.slice(0, 8)}</span>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">Detalhes da Solicitação</h3>
               </div>
               <button onClick={() => setSelectedRequest(null)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all cursor-pointer">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
               <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Motorista" value={selectedRequest.driver_name} />
                  <DetailItem label="Placa" value={selectedRequest.plate} />
                  <DetailItem label="Setor" value={selectedRequest.sector} />
                  <DetailItem label="Data Agendada" value={`${formatDateTime(selectedRequest.entry_date).date} às ${formatDateTime(selectedRequest.entry_date).time}`} />
               </div>

               {selectedRequest.rejection_reason && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                     <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-xs font-semibold text-rose-700">Motivo do Cancelamento / Recusa</p>
                        <p className="text-xs font-normal text-rose-900 mt-0.5">{selectedRequest.rejection_reason}</p>
                     </div>
                  </div>
               )}

               <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-3">Materiais na Remessa ({selectedRequest.materials?.length || 0})</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                     {selectedRequest.materials?.map((mat: any) => (
                       <button 
                        key={mat.id}
                        onClick={() => setSelectedMaterial(mat)}
                        className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 hover:border-primary/40 transition-all group text-left cursor-pointer"
                       >
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-xs border border-slate-100 text-primary">
                                <Package className="w-4 h-4" />
                             </div>
                             <div>
                                <p className="text-xs font-semibold text-slate-800 leading-none mb-1 group-hover:text-primary transition-colors">{mat.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">SN: {mat.serial_number || 'REGISTRO ÚNICO'}</p>
                             </div>
                          </div>
                          <div className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                             Ver Specs
                          </div>
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100">
               <button onClick={() => setSelectedRequest(null)} className="w-full py-2.5 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer">
                  Fechar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setSelectedMaterial(null)}>
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col md:flex-row max-h-[85vh] border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="md:w-[45%] relative bg-slate-100 shrink-0 min-h-[200px]">
              {selectedMaterial.image_url || selectedMaterial.imageUrl ? (
                <img 
                  src={selectedMaterial.image_url || selectedMaterial.imageUrl} 
                  alt={selectedMaterial.name} 
                  className="w-full h-full object-cover" 
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-no-img');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`fallback-no-img w-full h-full flex flex-col items-center justify-center text-slate-400 ${selectedMaterial.image_url || selectedMaterial.imageUrl ? 'hidden' : ''}`}>
                <Package className="w-10 h-10 opacity-30 mb-1" />
                <p className="text-xs font-normal text-slate-400">Sem imagem</p>
              </div>
            </div>
            <div className="md:w-[55%] flex flex-col overflow-hidden bg-white">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-primary font-semibold leading-none">Equipamento</p>
                      <h3 className="text-slate-900 font-bold text-xs mt-0.5 truncate max-w-[170px]">{selectedMaterial.name}</h3>
                    </div>
                 </div>
                 <button onClick={() => setSelectedMaterial(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Condição:</span>
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-md">
                    {selectedMaterial.condition || 'USADO'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Fabricante</p>
                    <p className="font-semibold text-slate-800 text-xs truncate">{selectedMaterial.brand || '---'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Modelo</p>
                    <p className="font-semibold text-slate-800 text-xs truncate">{selectedMaterial.model || '---'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Nº de Série</p>
                    <p className="font-mono text-xs font-medium text-slate-700 truncate">{selectedMaterial.serial_number || '---'}</p>
                  </div>
                </div>
                {selectedMaterial.description && (
                  <div className="pt-2 border-t border-slate-100">
                     <p className="text-[10px] text-slate-400 font-medium mb-1">Notas Adicionais</p>
                     <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-normal">
                       "{selectedMaterial.description}"
                     </p>
                  </div>
                )}
              </div>
              <div className="p-4 pt-2 border-t border-slate-100">
                <button onClick={() => setSelectedMaterial(null)} className="w-full bg-slate-900 text-white font-medium text-xs py-2 rounded-lg hover:bg-slate-800 transition-all cursor-pointer">
                  Fechar Detalhes
                </button>
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
       <p className="text-[11px] font-medium text-slate-500 mb-0.5 leading-none">{label}</p>
       <p className="font-semibold text-slate-800 text-xs">{value || '---'}</p>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  );
}
